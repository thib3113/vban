/**
 * @file This module conditionally loads the 'debug' library.
 * If 'debug' is not installed as a dependency, it falls back to a no-op mock function.
 * This allows 'debug' to be an optional peer dependency.
 */
import type { Debugger } from 'debug';
import { createRequire } from 'node:module';
import { pkg } from './pkg.js';

const require2 = require ?? createRequire(import.meta.url);

const mockDebug: Debugger = () => () => {};

mockDebug.enabled = false;
mockDebug.log = () => {};
mockDebug.extend = () => mockDebug;
mockDebug.color = '';
mockDebug.namespace = '';
mockDebug.diff = 0;
mockDebug.destroy = () => true;

let debugInstance;

try {
    const debugModule = require2('debug');

    debugInstance = debugModule.default(pkg.name);
} catch (error) {
    if (['ERR_MODULE_NOT_FOUND', 'MODULE_NOT_FOUND'].includes((error as any)?.code)) {
        debugInstance = mockDebug;
    } else {
        throw error;
    }
}

export const createDebugger = (name: string): Debugger => {
    if (!name) {
        throw new Error('name is mandatory');
    }
    return debugInstance.extend(name);
};
