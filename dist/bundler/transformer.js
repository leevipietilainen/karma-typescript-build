"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transformer = void 0;
var acorn = require("acorn");
var async = require("async");
var os = require("os");
var ts = require("typescript");
var Transformer = /** @class */ (function () {
    function Transformer(config, log, project) {
        this.config = config;
        this.log = log;
        this.project = project;
    }
    Transformer.prototype.applyTsTransforms = function (bundleQueue, onTransformsApplied) {
        var _this = this;
        var transforms = this.config.bundlerOptions.transforms;
        if (!transforms.length) {
            process.nextTick(function () {
                onTransformsApplied();
            });
            return;
        }
        async.eachSeries(bundleQueue, function (queued, onQueueProcessed) {
            var context = {
                config: _this.config,
                filename: queued.file.originalPath,
                module: queued.file.originalPath,
                source: queued.emitOutput.sourceFile.getFullText(),
                ts: {
                    ast: queued.emitOutput.sourceFile,
                    transpiled: queued.emitOutput.outputText,
                    version: ts.version
                }
            };
            async.eachSeries(transforms, function (transform, onTransformApplied) {
                process.nextTick(function () {
                    transform(context, function (error, result, transpile) {
                        if (transpile === void 0) { transpile = true; }
                        if (typeof result !== "object" || result === null) {
                            result = {
                                dirty: !!result,
                                transpile: transpile
                            };
                        }
                        _this.handleError(error, transform, context);
                        if (result.dirty) {
                            if (result.transpile) {
                                var transpiled = ts.transpileModule(context.source, {
                                    compilerOptions: _this.project.getTsconfig().options,
                                    fileName: context.filename
                                });
                                queued.emitOutput.outputText = transpiled.outputText;
                                queued.emitOutput.sourceMapText = transpiled.sourceMapText;
                            }
                            else {
                                queued.emitOutput.outputText = context.ts.transpiled;
                            }
                        }
                        onTransformApplied();
                    });
                });
            }, onQueueProcessed);
        }, onTransformsApplied);
    };
    Transformer.prototype.applyTransforms = function (bundleItem, onTransformsApplied) {
        var _this = this;
        var transforms = this.config.bundlerOptions.transforms;
        if (!transforms.length) {
            process.nextTick(function () {
                onTransformsApplied();
            });
            return;
        }
        var context = {
            config: this.config,
            filename: bundleItem.filename,
            js: {
                ast: bundleItem.ast || { end: 0, start: 0, type: "" }
            },
            module: bundleItem.moduleName,
            source: bundleItem.source
        };
        async.eachSeries(transforms, function (transform, onTransformApplied) {
            process.nextTick(function () {
                transform(context, function (error, result) {
                    if (typeof result !== "object" || result === null) {
                        result = {
                            dirty: !!result
                        };
                    }
                    _this.handleError(error, transform, context);
                    if (result.dirty) {
                        bundleItem.ast = context.js.ast;
                        bundleItem.source = context.source;
                        bundleItem.transformedScript = result.transformedScript;
                        if (result.transformedScript && bundleItem.ast) {
                            bundleItem.ast = acorn.parse(context.source, _this.config.bundlerOptions.acornOptions);
                        }
                    }
                    onTransformApplied();
                });
            });
        }, onTransformsApplied);
    };
    Transformer.prototype.handleError = function (error, transform, context) {
        if (error) {
            var errorMessage = context.filename + ": " + error.message + os.EOL +
                "Transform function: " + os.EOL + os.EOL +
                transform + os.EOL;
            this.log.error(errorMessage);
            throw new Error(errorMessage);
        }
    };
    return Transformer;
}());
exports.Transformer = Transformer;
//# sourceMappingURL=transformer.js.map