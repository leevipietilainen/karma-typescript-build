import * as log4js from "log4js";
import { ConfigOptions } from "karma";
import { BundlerOptions, CoverageOptions, Extendable, KarmaTypescriptConfig, Reports } from "../api";
export interface LoggerList {
    [key: string]: log4js.Logger;
}
export interface Configuration {
    [key: string]: any;
}
export declare class Configuration implements KarmaTypescriptConfig {
    private loggers;
    karma: ConfigOptions;
    bundlerOptions: BundlerOptions;
    compilerDelay: number;
    compilerOptions: any;
    coverageOptions: CoverageOptions;
    defaultTsconfig: any;
    exclude: string[] | Extendable;
    include: string[] | Extendable;
    logAppenders: {
        [name: string]: log4js.Appender;
    };
    reports: Reports;
    transformPath: (filepath: string) => string;
    tsconfig: string;
    stopOnFailure: boolean;
    hasCoverageThreshold: boolean;
    private asserted;
    private karmaTypescriptConfig;
    private callbacks;
    constructor(loggers: LoggerList);
    initialize(config: ConfigOptions): void;
    whenReady(callback: () => void): void;
    hasFramework(name: string): boolean;
    hasPreprocessor(name: string): boolean;
    hasReporter(name: string): boolean;
    private configureLogging;
    private configureBundler;
    private configureCoverage;
    private configureProject;
    private configurePreprocessor;
    private configureReporter;
    private assertConfiguration;
    private assertFrameworkConfiguration;
    private assertExtendable;
    private assertDeprecatedOptions;
    private assertCoverageExclude;
    private throwCoverageExcludeError;
}
