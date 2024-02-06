import {createWebHashHistory, createRouter} from "vue-router";

const index = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '',
            component: () => import('../components/DefaultShell.vue'),
            children: [
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
                                    path: '/params',
                                    component: () => import('../components/tic/steps/Parameters.vue'),
                                },
                                {
                                    path: '/spike-mode',
                                    component: () => import('../components/tic/steps/SpikeMode.vue'),
                                }
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
                    path: '/settings/general',
                    component: () => import('../components/settings/Settings.vue'),
                },
                {
                    path: '/settings/images',
                    children: [
                        {
                            path: '/settings/images/tic-pipeline',
                            component: () => import('../components/settings/images/TicPipelineImageSettings.vue'),
                        },
                        {
                            path: '/settings/images/shiny-rhea',
                            component: () => import('../components/settings/images/ShinyRheaImageSettings.vue'),
                        },
                    ]
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
