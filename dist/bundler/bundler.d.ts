import { FilePattern } from "karma";
import { Logger } from "log4js";
import { EmitOutput } from "../compiler/emit-output";
import { Configuration } from "../shared/configuration";
import { File } from "../shared/file";
import { Project } from "../shared/project";
import { BundleCallback } from "./bundle-callback";
import { DependencyWalker } from "./dependency-walker";
import { Globals } from "./globals";
import { Resolver } from "./resolve/resolver";
import { SourceMap } from "./source-map";
import { Transformer } from "./transformer";
import { Validator } from "./validator";
import "../client/commonjs";
export declare class Bundler {
    private config;
    private dependencyWalker;
    private globals;
    private log;
    private project;
    private resolver;
    private sourceMap;
    private transformer;
    private validator;
    private readonly BUNDLE_DELAY;
    private bundleQueuedModulesDeferred;
    private bundleBuffer;
    private bundleFile;
    private bundleQueue;
    private entrypoints;
    private projectImportCountOnFirstRun;
    constructor(config: Configuration, dependencyWalker: DependencyWalker, globals: Globals, log: Logger, project: Project, resolver: Resolver, sourceMap: SourceMap, transformer: Transformer, validator: Validator);
    attach(files: FilePattern[]): void;
    bundle(file: File, emitOutput: EmitOutput, callback: BundleCallback): void;
    private bundleQueuedModules;
    private shouldBundle;
    private bundleWithLoader;
    private bundleWithoutLoader;
    private onAllResolved;
    private addLoaderFunction;
    private createEntrypointFilenames;
    private addEntrypointFilename;
    private orderEntrypoints;
    private writeMainBundleFile;
}
