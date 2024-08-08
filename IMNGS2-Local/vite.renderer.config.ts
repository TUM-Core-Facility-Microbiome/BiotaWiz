import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import { forgeViteConfig } from 'electron-forge-plugin-vite/migration';

// https://vitejs.dev/config
export default defineConfig(forgeViteConfig.renderer({
    plugins: [vue()]
}));
