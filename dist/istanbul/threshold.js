"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Threshold = void 0;
var istanbulCoverage = require("istanbul-lib-coverage");
var lodash_1 = require("lodash");
var minimatch = require("minimatch");
var file_utils_1 = require("../shared/file-utils");
var Threshold = /** @class */ (function () {
    function Threshold(config, log) {
        this.config = config;
        this.log = log;
    }
    Threshold.prototype.check = function (browser, coverageMap) {
        var _this = this;
        var passedThreshold = true;
        var checkThresholds = function (name, thresholds, coverageSummary) {
            ["branches", "functions", "lines", "statements"].forEach(function (key) {
                var result = coverageSummary[key];
                var uncovered = result.total - result.covered;
                var threshold = thresholds[key];
                if (threshold < 0 && threshold * -1 < uncovered) {
                    passedThreshold = false;
                    _this.log.error("%s: Expected max %s uncovered %s, got %s (%s)", browser.name, (-1 * threshold), key, uncovered, name);
                }
                else if (result.pct < threshold) {
                    passedThreshold = false;
                    _this.log.error("%s: Expected %s% coverage for %s, got %s% (%s)", browser.name, threshold, key, result.pct, name);
                }
            });
        };
        var thresholdConfig = this.config.coverageOptions.threshold;
        var globalSummary = istanbulCoverage.createCoverageSummary();
        var globalSummaries = this.toSummaries(coverageMap, thresholdConfig.global.excludes);
        var fileSummaries = this.toSummaries(coverageMap, thresholdConfig.file.excludes);
        Object.keys(globalSummaries).forEach(function (filename) {
            globalSummary.merge(globalSummaries[filename]);
        });
        checkThresholds("global", thresholdConfig.global, globalSummary);
        Object.keys(fileSummaries).forEach(function (filename) {
            var relativeFilename = file_utils_1.FileUtils.getRelativePath(filename, _this.config.karma.basePath);
            var thresholds = lodash_1.merge(thresholdConfig.file, _this.getFileOverrides(relativeFilename));
            checkThresholds(filename, thresholds, fileSummaries[filename]);
        });
        return passedThreshold;
    };
    Threshold.prototype.toSummaries = function (coverageMap, excludes) {
        var _this = this;
        var result = {};
        coverageMap.files().forEach(function (filename) {
            var relativeFilename = file_utils_1.FileUtils.getRelativePath(filename, _this.config.karma.basePath);
            if (!_this.isExcluded(relativeFilename, excludes)) {
                var fileCoverage = coverageMap.fileCoverageFor(filename);
                result[filename] = fileCoverage.toSummary();
            }
        });
        return result;
    };
    Threshold.prototype.isExcluded = function (relativeFilename, excludes) {
        return excludes.some(function (pattern) {
            return minimatch(relativeFilename, pattern, { dot: true });
        });
    };
    Threshold.prototype.getFileOverrides = function (relativeFilename) {
        var thresholds = {};
        var overrides = this.config.coverageOptions.threshold.file.overrides;
        Object.keys(overrides).forEach(function (pattern) {
            if (minimatch(relativeFilename, pattern, { dot: true })) {
                thresholds = overrides[pattern];
            }
        });
        return thresholds;
    };
    return Threshold;
}());
exports.Threshold = Threshold;
//# sourceMappingURL=threshold.js.map