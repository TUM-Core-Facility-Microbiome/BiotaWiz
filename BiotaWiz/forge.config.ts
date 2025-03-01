import type {ForgeConfig} from '@electron-forge/shared-types';
import {MakerSquirrel} from '@electron-forge/maker-squirrel';
import {MakerDeb} from '@electron-forge/maker-deb';
import {VitePlugin} from '@electron-forge/plugin-vite';
import {MakerRpm} from "@electron-forge/maker-rpm";
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import path from 'path';
import fs from 'fs';

const config: ForgeConfig = {
    packagerConfig: {
        executableName: "biotawiz",
        icon: "./assets/icons/icon",
        asar: true,
    },
    rebuildConfig: {},
    hooks: {
        packageAfterCopy: async (config, buildPath, electronVersion, platform, arch) => {
            try {
                console.log('Running packageAfterCopy hook...');
                
                // List of modules to copy
                const modulesToCopy = [
                    'axios',
                    'form-data',
                    'asynckit',
                    'mime-types',
                    'mime-db',
                    'combined-stream',
                    'follow-redirects',
                    'proxy-from-env',
                    'delayed-stream',
                ];
                
                // ensure the node_modules directory exists
                const nodeModulesDir = path.join(buildPath, 'node_modules');
                fs.mkdirSync(nodeModulesDir, { recursive: true });
                
                // copy each module
                for (const moduleName of modulesToCopy) {
                    const modulePath = path.join(__dirname, 'node_modules', moduleName);
                    const moduleDestination = path.join(nodeModulesDir, moduleName);
                    
                    console.log(`Copying ${moduleName} from ${modulePath} to ${moduleDestination}`);
                    
                    if (fs.existsSync(modulePath)) {
                        fs.cpSync(modulePath, moduleDestination, { recursive: true });
                        console.log(`Successfully copied ${moduleName} module`);
                    } else {
                        console.error(`WARNING: ${moduleName} module not found at ${modulePath}`);
                    }
                }
            } catch (error) {
                console.error('Error in packageAfterCopy hook:', error);
            }
        }
    },
    makers: [
        new MakerSquirrel({
            setupIcon: "./assets/icons/icon.ico",
        }),
        // new MakerZIP({}, ['darwin']),
        new MakerRpm({
            options: {
                icon: "./assets/icons/icon.png",
            }
        }),
        new MakerDeb({
            options: {
                icon: "./assets/icons/icon.png",
            }
        })],
    plugins: [
        new AutoUnpackNativesPlugin({}),
        new VitePlugin({
            // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
            // If you are familiar with Vite configuration, it will look really familiar.
            build: [
                {
                    // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
                    entry: 'src/main.ts',
                    config: 'vite.main.config.ts',
                },
                {
                    entry: 'src/preload.ts',
                    config: 'vite.preload.config.ts',
                },
            ],
            renderer: [
                {
                    name: 'main_window',
                    config: 'vite.renderer.config.ts',
                },
            ],
        }),
    ],
    publishers: [
        {
            name: '@electron-forge/publisher-github',
            config: {
                repository: {
                    owner: 'TUM-Core-Facility-Microbiome',
                    name: 'BiotaWiz'
                },
                draft: true,
                // take the token from the environment
                authToken: process.env.GITHUB_TOKEN
            }
        }
    ]
};

export default config;
