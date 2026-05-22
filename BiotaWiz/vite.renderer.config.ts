import {defineConfig} from 'vite';
import { forgeViteConfig } from 'electron-forge-plugin-vite/migration';

// https://vitejs.dev/config
// @vitejs/plugin-vue v6 is ESM-only; use dynamic import so Forge's CJS loader can still require this config
export default defineConfig(async (env) => {
    const { default: vue } = await import('@vitejs/plugin-vue');
    return forgeViteConfig.renderer({ plugins: [vue()] })(env as any);
});
