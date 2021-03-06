import * as acorn from "acorn";
import * as ts from "typescript";
import { Transform } from "./transforms";
export interface KarmaTypescriptConfig {
    [key: string]: any;
    bundlerOptions?: BundlerOptions;
    compilerDelay?: number;
    compilerOptions?: any;
    coverageOptions?: CoverageOptions;
    exclude?: string[] | Extendable;
    include?: string[] | Extendable;
    reports?: Reports;
    transformPath?: (filepath: string) => string;
    tsconfig?: string;
    stopOnFailure?: boolean;
}
export interface BundlerOptions {
    acornOptions?: acorn.Options;
    addNodeGlobals?: boolean;
    constants?: {
        [key: string]: any;
    };
    entrypoints?: RegExp;
    exclude?: string[];
    ignore?: string[];
    noParse?: string[];
    resolve?: Resolve;
    sourceMap?: boolean;
    transforms?: Transform[];
    validateSyntax?: boolean;
}
export interface Extendable {
    mode: "merge" | "replace";
    values: string[];
}
export interface Resolve {
    alias?: {
        [key: string]: string;
    };
    extensions?: string[];
    directories?: string[];
}
export interface CompilerOptions extends ts.CompilerOptions {
    [key: string]: any;
}
export interface ThresholdOptions {
    file?: {
        branches?: number;
        excludes?: string[];
        functions?: number;
        lines?: number;
        overrides?: {
            [key: string]: {
                branches?: number;
                functions?: number;
                lines?: number;
                statements: number;
            };
        };
        statements?: number;
    };
    global?: {
        branches?: number;
        excludes?: string[];
        functions?: number;
        lines?: number;
        statements?: number;
    };
}
export interface CoverageOptions {
    instrumentation?: boolean;
    instrumenterOptions?: any;
    exclude?: RegExp | RegExp[];
    threshold?: ThresholdOptions;
}
export interface Reports {
    clover?: string | Destination;
    cobertura?: string | Destination;
    html?: string | Destination;
    "html-spa"?: string | Destination;
    "json-summary"?: string | Destination;
    json?: string | Destination;
    lcovonly?: string | Destination;
    teamcity?: string | Destination;
    "text-lcov"?: string | Destination;
    "text-summary"?: string | Destination;
    text?: string | Destination;
    [key: string]: string | Destination;
}
export interface Destination {
    directory?: string;
    filename?: string;
    subdirectory?: string | (() => void);
}
