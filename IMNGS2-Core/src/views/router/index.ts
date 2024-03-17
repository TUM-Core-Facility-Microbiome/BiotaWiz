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
                            redirect: '/base-selection',
                        },
                        {
                            path: '/tic',
                            component: () => import('../components/tic/TicPipelineWizard.vue'),
                            redirect: '/base-selection',
                            children: [
                                {
                                    path: '/base-selection',
                                    component: () => import('../components/tic/steps/BaseSelection.vue'),
                                },
                                {
                                    path: '/study-selection',
                                    component: () => import('../components/tic/steps/StudySelection.vue'),
                                },
                                {
                                    path: '/spike-mode',
                                    component: () => import('../components/tic/steps/SpikeMode.vue'),
                                },
                                {
                                    path: '/check-mapping',
                                    component: () => import('../components/tic/steps/CheckMappingFile.vue'),
                                },
                                {
                                    path: '/params',
                                    component: () => import('../components/tic/steps/Parameters.vue'),
                                },
                                {
                                    path: '/usearch',
                                    component: () => import('../components/tic/steps/Usearch.vue'),
                                },
                                {
                                    path: '/run',
                                    component: () => import('../components/tic/steps/TicRun.vue'),
                                },
                            ]
                        },
                        {
                            path: '/rhea',
                            component: () => import('../components/rhea/RheaOutLink.vue'),
                        },
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
                            path: '/settings/environment/tic-pipeline',
                            component: () => import('../components/settings/environments/TicPipelineEnvironmentSettings.vue'),
                        },
                        {
                            path: '/settings/environment/shiny-rhea',
                            component: () => import('../components/settings/environments/ShinyRheaEnvironmentSettings.vue'),
                        },
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
