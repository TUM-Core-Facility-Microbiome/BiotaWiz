import {defineConfig} from 'vite';
import { forgeViteConfig } from 'electron-forge-plugin-vite/migration';

// https://vitejs.dev/config
export default defineConfig(forgeViteConfig.main({
    resolve: {
        browserField: false,
        mainFields: ['module', 'jsnext:main', 'jsnext'],
    },
}));
