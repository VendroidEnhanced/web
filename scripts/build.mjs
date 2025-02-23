import * as esbuild from "esbuild";

/**
 * @type {esbuild.Plugin}
 */
const makeAllPackagesExternalPlugin = {
    name: "make-all-packages-external",
    setup(build) {
        const filter = /^[^./|~]|^\.[^./]|^\.\.[^/]/; // Must not start with "/" or "./" or "../"
        build.onResolve({ filter }, (args) => ({ path: args.path, external: true }));
    }
};

await esbuild.build({
    entryPoints: ["src/index.ts"],
    bundle: true,
    platform: "node",
    minify: true,
    treeShaking: true,
    target: "esnext",
    outfile: "dist/index.js",
    plugins: [makeAllPackagesExternalPlugin]
});
