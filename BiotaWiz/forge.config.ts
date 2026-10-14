import type {ForgeConfig} from '@electron-forge/shared-types';
import {MakerSquirrel} from '@electron-forge/maker-squirrel';
import {MakerDeb} from '@electron-forge/maker-deb';
import {VitePlugin} from '@electron-forge/plugin-vite';
// import {MakerRpm} from "@electron-forge/maker-rpm";
import {version} from './package.json';

const config: ForgeConfig = {
    packagerConfig: {
        executableName: "biotawiz",
        icon: "./assets/icons/icon",
    },
    rebuildConfig: {},
    makers: [
        new MakerSquirrel({
            setupIcon: "./assets/icons/icon.ico",
        }),
        // new MakerZIP({}, ['darwin']),
        // new MakerRpm({
        //     options: {
        //         icon: "./assets/icons/icon.png",
        //     }
        // }),
        new MakerDeb({
            options: {
                icon: "./assets/icons/icon.png",
            }
        })],
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
                    name: 'BiotaWiz'
                },
                // releases must be published (not drafts) so that the in-app updater can find them
                draft: false,
                // versions like 1.2.3-beta.1 are marked as pre-release and therefore not offered as updates
                prerelease: version.includes('-'),
                // take the token from the environment
                authToken: process.env.GITHUB_TOKEN
            }
        }
    ]
};

export default config;
