import type {ForgeConfig} from '@electron-forge/shared-types';
import {MakerSquirrel} from '@electron-forge/maker-squirrel';
import {MakerDeb} from '@electron-forge/maker-deb';
import {VitePlugin} from '@electron-forge/plugin-vite';
import MakerZIP from "@electron-forge/maker-zip";
import MakerDmg from "@electron-forge/maker-dmg";

const config: ForgeConfig = {
    packagerConfig: {
        executableName: "imngs2-core",
        icon: "./assets/icons/icon",
    },
    rebuildConfig: {},
    makers: [
        new MakerSquirrel({
            setupIcon: "./assets/icons/icon.ico",
        }),
        // new MakerRpm({}),
        new MakerDeb({
            options: {
                icon: "./assets/icons/icon.png",
            }
        }),
        new MakerZIP({}, ['darwin']),
        new MakerDmg({}),
    ],
    plugins: [
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
                    name: 'IMNGS2-Core'
                },
                draft: true,
                // take the token from the environment
                authToken: process.env.GITHUB_TOKEN
            }
        }
    ]
};

export default config;
