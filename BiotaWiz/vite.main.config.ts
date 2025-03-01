import {defineConfig} from 'vite';
import { forgeViteConfig } from 'electron-forge-plugin-vite/migration';
import path from 'path';

// https://vitejs.dev/config
export default defineConfig(forgeViteConfig.main({
    resolve: {
        // Some libs that can run in both Web and Node.js, such as `axios`, we need to tell Vite to build them in Node.js.
        browserField: false,
        mainFields: ['module', 'jsnext:main', 'jsnext'],
        alias: {
            'axios': require.resolve('axios'),
        },
    },
    build: {
        rollupOptions: {
            external: [
                'axios', 
                'electron', 
                'path', 
                'fs', 
                'form-data',
                'asynckit',
                'mime-types',
                'mime-db',
                'combined-stream',
                'follow-redirects',
                'proxy-from-env'
            ],
        },
        commonjsOptions: {
            include: [/node_modules/],
        },
    },
    optimizeDeps: {
        include: ['axios', 'form-data'],
    },
}));
