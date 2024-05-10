import {createWebHashHistory, createRouter} from "vue-router";

const index = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '',
            component: () => import('../components/DefaultShell.vue'),
            redirect: '/application-selector',
            children: [
                {
                    path: '/application-selector',
                    component: () => import('../components/ApplicationSelection.vue'),
                },
                {
                    path: '/application-shell',
                    component: () => import('../components/ApplicationShell.vue'),
                    children: [
                        {
                            path: '/',
                            redirect: '/application-shell/base-selection',
                        },
                        {
                            path: '/application-shell/imngs2core',
                            component: () => import('../components/imngs2core/Imngs2CoreWizard.vue'),
                            redirect: '/application-shell/imngs2core/base-selection',
                            children: [
                                {
                                    path: '/application-shell/imngs2core/base-selection',
                                    component: () => import('../components/imngs2core/steps/BaseSelection.vue'),
                                },
                                {
                                    path: '/application-shell/imngs2core/study-selection',
                                    component: () => import('../components/imngs2core/steps/StudySelection.vue'),
                                },
                                {
                                    path: '/application-shell/imngs2core/spike-mode',
                                    component: () => import('../components/imngs2core/steps/SpikeMode.vue'),
                                },
                                {
                                    path: '/application-shell/imngs2core/check-mapping',
                                    component: () => import('../components/imngs2core/steps/CheckMappingFile.vue'),
                                },
                                {
                                    path: '/application-shell/imngs2core/params',
                                    component: () => import('../components/imngs2core/steps/Parameters.vue'),
                                },
                                {
                                    path: '/application-shell/imngs2core/usearch',
                                    component: () => import('../components/imngs2core/steps/Usearch.vue'),
                                },
                                {
                                    path: '/application-shell/imngs2core/run',
                                    component: () => import('../components/imngs2core/steps/Imngs2CoreRun.vue'),
                                },
                            ]
                        },
                        {
                            path: '/application-shell/namco',
                            component: () => import('../components/namco/OutLink.vue'),
                        },
/*                        {
                            path: '/application-shell/rhea',
                            component: () => import('../components/rhea/RheaOutLink.vue'),
                        },*/
                    ]
                },
                {
                    path: '/third-party-licenses',
                    component: () => import('../components/license/ThirdPartyLicenses.vue'),
                },
            ]
        },
        {
            path: '/settings',
            component: () => import('../components/settings/SettingsShell.vue'),
            children: [
                {
                    path: '',
                    redirect: '/settings/general',
                },
                {
                    path: '/settings/environment',
                    children: [
                        {
                            path: '/settings/environment/imngs2core',
                            component: () => import('../components/settings/environments/Imngs2CoreEnvironmentSettings.vue'),
                        },
/*                        {
                            path: '/settings/environment/shiny-rhea',
                            component: () => import('../components/settings/environments/ShinyRheaEnvironmentSettings.vue'),
                        },*/
                    ]
                },
                {
                    path: '/settings/general',
                    component: () => import('../components/settings/General.vue'),
                },
                {
                    path: '/settings/backend',
                    component: () => import('../components/settings/BackendSettings.vue'),
                },
            ]
        },
        {
            path: "/:catchAll(.*)",
            redirect: "/"
        },
    ]
});

export default index;
