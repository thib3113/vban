import esbuild from 'esbuild';
import path from 'path';
import fs from 'fs';
import * as url from 'url';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const tsConfig = JSON.parse(fs.readFileSync('./tsconfig.json').toString());

const dist = path.join(__dirname, tsConfig.compilerOptions.outDir);

if (!fs.existsSync(dist)) {
    fs.mkdirSync(dist);
}

const baseDir = process.env.INIT_CWD;
const PACKAGE_JSON_PATH = path.join(baseDir, 'package.json');

const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH).toString());

if (!pkg?.name) {
    throw new Error(`fail to read package.json`);
}
fs.writeFileSync(
    path.join(baseDir, 'src', 'pkg.ts'),
    `// THIS FILE IS GENERATED ON BUILD - DO NOT EDIT MANUALLY\nexport const pkg = { name: '${pkg.name}', version: '${pkg.version}' };\n`
);

let makeAllPackagesExternalPlugin = {
    name: 'make-all-packages-external',
    setup(build) {
        let filter = /^[^./]|^\.[^./]|^\.\.[^/]/; // Must not start with "/" or "./" or "../"
        build.onResolve({ filter }, (args) => ({ path: args.path, external: true }));
    }
};

const globalConfig = {
    entryPoints: ['src/index.ts'],
    bundle: true,
    sourcemap: true,
    minify: false,
    plugins: [makeAllPackagesExternalPlugin]
};

esbuild
    .build({
        ...globalConfig,
        banner: {
            js: "import { createRequire as topLevelCreateRequire } from 'module';\n const require = topLevelCreateRequire(import.meta.url);"
        },
        outdir: path.join(dist, 'esm'),
        splitting: true,
        format: 'esm',
        outExtension: { '.js': '.mjs' },
        target: ['esnext']
    })
    .catch(() => process.exit(1));
esbuild
    .build({
        ...globalConfig,
        outdir: path.join(dist, 'cjs'),
        format: 'cjs',
        outExtension: { '.js': '.cjs' },
        platform: 'node',
        target: ['node16']
    })
    .catch(() => process.exit(1));

// an entry file for cjs at the root of the bundle
fs.writeFileSync(path.join(dist, 'index.mjs'), "export * from './esm/index.mjs';");

// an entry file for esm at the root of the bundle
fs.writeFileSync(path.join(dist, 'index.cjs'), "module.exports = require('./cjs/index.cjs');");
fs.writeFileSync(path.join(dist, 'index.js'), "module.exports = require('./cjs/index.cjs');");

fs.writeFileSync(path.join(dist, 'index.d.ts'), "export * from './types/index.js';");
fs.writeFileSync(path.join(dist, 'index.d.cts'), "export * from './types/index.js';");
