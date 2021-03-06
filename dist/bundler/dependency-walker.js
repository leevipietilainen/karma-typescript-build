"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DependencyWalker = void 0;
var async = require("async");
var diff = require("diff");
var fs = require("fs");
var glob = require("glob");
var lodash = require("lodash");
var os = require("os");
var path = require("path");
var ts = require("typescript");
var pad = require("pad");
var bundle_item_1 = require("./bundle-item");
var DependencyWalker = /** @class */ (function () {
    function DependencyWalker(log) {
        this.log = log;
        this.requireRegexp = /\brequire\b/;
        this.walk = require("acorn-walk");
    }
    DependencyWalker.prototype.hasRequire = function (s) {
        return this.requireRegexp.test(s);
    };
    DependencyWalker.prototype.collectTypescriptDependencies = function (queue) {
        var _this = this;
        var dependencyCount = 0;
        var ambientModuleNames = this.collectAmbientModules(queue);
        queue.forEach(function (queued) {
            queued.item.dependencies = _this.findUnresolvedTsRequires(queued.emitOutput);
            var resolvedModules = queued.emitOutput.sourceFile.resolvedModules;
            if (resolvedModules && !queued.emitOutput.isDeclarationFile) {
                if (lodash.isMap(resolvedModules)) { // Typescript 2.2+
                    resolvedModules.forEach(function (resolvedModule, moduleName) {
                        _this.addBundleItem(queued, resolvedModule, moduleName, ambientModuleNames);
                    });
                }
                else { // Typescript 1.6.2 - 2.1.6
                    Object.keys(resolvedModules).forEach(function (moduleName) {
                        var resolvedModule = resolvedModules[moduleName];
                        _this.addBundleItem(queued, resolvedModule, moduleName, ambientModuleNames);
                    });
                }
            }
            dependencyCount += queued.item.dependencies.length;
        });
        this.validateCase(queue);
        return dependencyCount;
    };
    DependencyWalker.prototype.collectJavascriptDependencies = function (bundleItem, onDependenciesCollected) {
        var _this = this;
        var moduleNames = [];
        var expressions = [];
        var isRequire = function (node) {
            return node.type === "CallExpression" &&
                node.callee.type === "Identifier" &&
                node.callee.name === "require";
        };
        var visitNode = function (node, state, c) {
            if (!_this.hasRequire(bundleItem.source.slice(node.start, node.end))) {
                return;
            }
            _this.walk.base[node.type](node, state, c);
            if (isRequire(node) && node.arguments.length > 0) {
                if (node.arguments[0].type === "Literal") {
                    if (!lodash.isString(node.arguments[0].value)) {
                        _this.log.error("Unexpected literal value: %s%sRequired by: %s", node.arguments[0].value, os.EOL, bundleItem.filename);
                    }
                    moduleNames.push(node.arguments[0].value);
                }
                else {
                    expressions.push(node.arguments[0]);
                }
            }
        };
        if (bundleItem.ast) {
            this.walk.recursive(bundleItem.ast, null, {
                Expression: visitNode,
                Statement: visitNode
            });
        }
        this.addDynamicDependencies(expressions, bundleItem, function (dynamicDependencies) {
            onDependenciesCollected(moduleNames.concat(dynamicDependencies));
        });
    };
    DependencyWalker.prototype.collectAmbientModules = function (queue) {
        var ambientModuleNames = [];
        queue.forEach(function (queued) {
            if (queued.emitOutput.ambientModuleNames) {
                ambientModuleNames.push.apply(ambientModuleNames, queued.emitOutput.ambientModuleNames);
            }
        });
        return ambientModuleNames;
    };
    DependencyWalker.prototype.addBundleItem = function (queued, resolvedModule, moduleName, ambientModuleNames) {
        if (ambientModuleNames.indexOf(moduleName) === -1) {
            queued.item.dependencies.push(new bundle_item_1.BundleItem(moduleName, resolvedModule && resolvedModule.resolvedFileName));
        }
    };
    DependencyWalker.prototype.findUnresolvedTsRequires = function (emitOutput) {
        var dependencies = [];
        if (emitOutput.isDeclarationFile) {
            return dependencies;
        }
        var visitNode = function (node) {
            if (node.kind === ts.SyntaxKind.CallExpression) {
                var ce = node;
                var expression = ce.expression ?
                    ce.expression :
                    undefined;
                var argument = ce.arguments && ce.arguments.length ?
                    ce.arguments[0] :
                    undefined;
                if (expression && expression.text === "require" &&
                    argument && typeof argument.text === "string") {
                    dependencies.push(new bundle_item_1.BundleItem(argument.text));
                }
            }
            ts.forEachChild(node, visitNode);
        };
        visitNode(emitOutput.sourceFile);
        return dependencies;
    };
    DependencyWalker.prototype.addDynamicDependencies = function (expressions, bundleItem, onDynamicDependenciesAdded) {
        var _this = this;
        var dynamicDependencies = [];
        if (expressions.length === 0) {
            process.nextTick(function () {
                onDynamicDependenciesAdded(dynamicDependencies);
            });
            return;
        }
        async.each(expressions, function (expression, onExpressionResolved) {
            var dynamicModuleName = _this.parseDynamicRequire(expression);
            var directory = path.dirname(bundleItem.filename);
            var pattern;
            if (dynamicModuleName && dynamicModuleName !== "*") {
                if (new bundle_item_1.BundleItem(dynamicModuleName).isNpmModule()) {
                    dynamicDependencies.push(dynamicModuleName);
                    onExpressionResolved();
                }
                else {
                    pattern = path.join(directory, dynamicModuleName);
                    glob(pattern, function (globError, matches) {
                        if (globError) {
                            throw globError;
                        }
                        async.each(matches, function (match, onMatchResolved) {
                            fs.stat(match, function (statError, stats) {
                                if (statError) {
                                    throw statError;
                                }
                                if (stats.isFile()) {
                                    _this.log.debug("Dynamic require: \nexpression: [%s]" +
                                        "\nfilename: %s\nrequired by %s\nglob: %s", JSON.stringify(expression, undefined, 3), match, bundleItem.filename, pattern);
                                    dynamicDependencies.push("./" + path.relative(directory, match));
                                }
                                onMatchResolved();
                            });
                        }, onExpressionResolved);
                    });
                }
            }
            else {
                onExpressionResolved();
            }
        }, function () {
            onDynamicDependenciesAdded(dynamicDependencies);
        });
    };
    DependencyWalker.prototype.parseDynamicRequire = function (expression) {
        var visitNode = function (node) {
            switch (node.type) {
                case "BinaryExpression":
                    if (node.operator === "+") {
                        return visitNode(node.left) + visitNode(node.right);
                    }
                    break;
                case "ExpressionStatement":
                    return visitNode(node.expression);
                case "Literal":
                    return node.value + "";
                case "Identifier":
                    return "*";
                default:
                    return "";
            }
        };
        return visitNode(expression);
    };
    DependencyWalker.prototype.validateCase = function (queue) {
        var files = queue.map(function (q) {
            return q.file.originalPath;
        });
        var fileslower = queue.map(function (q) {
            return q.file.originalPath.toLowerCase();
        });
        queue.forEach(function (queued) {
            if (queued.item.dependencies) {
                queued.item.dependencies.forEach(function (dependency) {
                    if (dependency.filename && files.indexOf(dependency.filename) === -1) {
                        var lowerIndex = fileslower.indexOf(dependency.filename.toLowerCase());
                        if (lowerIndex !== -1) {
                            var result = diff.diffChars(files[lowerIndex], dependency.filename);
                            var arrows_1 = "";
                            result.forEach(function (part) {
                                if (part.added) {
                                    arrows_1 += "^";
                                }
                                else if (!part.removed) {
                                    arrows_1 += pad("", part.count);
                                }
                            });
                            throw new Error("Uppercase/lowercase mismatch importing " +
                                dependency.moduleName + " from " + queued.file.originalPath +
                                ":" + os.EOL + os.EOL +
                                "filename:    " + files[lowerIndex] + os.EOL +
                                "module name: " + dependency.filename + os.EOL +
                                "             " + arrows_1 + os.EOL);
                        }
                    }
                });
            }
        });
    };
    return DependencyWalker;
}());
exports.DependencyWalker = DependencyWalker;
//# sourceMappingURL=dependency-walker.js.map