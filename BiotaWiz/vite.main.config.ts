import {defineConfig} from 'vite';

// https://vitejs.dev/config
export default defineConfig({
    resolve: {
        // Disable browser field so Node.js entry points are used instead
        browserField: false,
        // Include 'main' so CJS-only packages (e.g. electron-json-storage) are resolved correctly
        mainFields: ['module', 'jsnext:main', 'jsnext', 'main'],
    },
});
