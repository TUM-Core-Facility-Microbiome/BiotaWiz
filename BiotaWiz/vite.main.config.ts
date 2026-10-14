import {defineConfig} from 'vite';

// https://vitejs.dev/config
export default defineConfig({
    resolve: {
        // Disable browser field so Node.js entry points are used instead
        browserField: false,
        // Include 'main' so CJS-only packages (e.g. electron-json-storage) are resolved correctly
        mainFields: ['module', 'jsnext:main', 'jsnext', 'main'],
    },
    build: {
        commonjsOptions: {
            // Leave require() calls of native addons untouched instead of bundling them.
            // dockerode depends on ssh2, which optionally loads the native addons sshcrypto.node and cpu-features
            // when they were compiled during `npm install` (e.g., on Linux). Bundling them fails, as the binary .node
            // files cannot be parsed. ssh2 loads both in a try/catch and falls back to JavaScript, so at runtime the
            // untouched require() calls simply fail and are caught.
            // Do not externalize whole packages (e.g., dockerode) instead: the Vite plugin only packages the bundled
            // .vite folder, not node_modules.
            ignore: (id: string) => id === 'cpu-features' || id.endsWith('.node'),
        },
    },
});
