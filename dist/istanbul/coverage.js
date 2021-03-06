"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Coverage = void 0;
var convertSourceMap = require("convert-source-map");
var istanbul = require("istanbul-lib-instrument");
var path = require("path");
var Coverage = /** @class */ (function () {
    function Coverage(config) {
        this.config = config;
    }
    Coverage.prototype.initialize = function (logger) {
        var _this = this;
        this.log = logger.create("coverage.karma-typescript");
        this.log.debug("Initializing");
        this.config.whenReady(function () {
            _this.log.debug("Configuring coverage preprocessor");
            _this.instrumenter = istanbul.createInstrumenter(_this.config.coverageOptions.instrumenterOptions);
        });
    };
    Coverage.prototype.instrument = function (file, bundled, emitOutput, callback) {
        var _this = this;
        if (this.config.hasPreprocessor("commonjs")) {
            this.log.debug("karma-commonjs already configured");
            callback(bundled);
            return;
        }
        if (this.config.hasPreprocessor("coverage")) {
            this.log.debug("karma-coverage already configured");
            callback(bundled);
            return;
        }
        if (!this.config.coverageOptions.instrumentation ||
            this.isExcluded(this.config.coverageOptions.exclude, file.relativePath) ||
            this.hasNoOutput(emitOutput)) {
            this.log.debug("Excluding file %s from instrumentation", file.originalPath);
            callback(bundled);
            return;
        }
        this.log.debug("Processing \"%s\".", file.originalPath);
        var sourceMap = convertSourceMap.fromSource(bundled);
        if (!sourceMap) {
            sourceMap = convertSourceMap.fromMapFileSource(bundled, path.dirname(file.originalPath));
        }
        this.instrumenter.instrument(bundled, file.originalPath, function (error, instrumentedSource) {
            if (error) {
                _this.log.error("%s\nin %s", error.message, file.originalPath);
                callback(error.message);
            }
            else {
                callback(instrumentedSource);
            }
        }, sourceMap ? sourceMap.sourcemap : undefined);
    };
    Coverage.prototype.hasNoOutput = function (emitOutput) {
        return emitOutput.outputText.startsWith("//# sourceMappingURL=");
    };
    Coverage.prototype.isExcluded = function (regex, filePath) {
        if (Array.isArray(regex)) {
            for (var _i = 0, regex_1 = regex; _i < regex_1.length; _i++) {
                var r = regex_1[_i];
                if (r.test(filePath)) {
                    return true;
                }
            }
            return false;
        }
        return regex.test(filePath);
    };
    return Coverage;
}());
exports.Coverage = Coverage;
//# sourceMappingURL=coverage.js.map