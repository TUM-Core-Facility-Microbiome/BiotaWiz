import {createWebHashHistory, createRouter} from "vue-router";

const index = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            redirect: '/startup',
        },
        {
            path: '/startup',
            component: () => import('../components/startup/Startup.vue'),
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
                            path: '/arguments',
                            component: () => import('../components/tic/steps/Arguments.vue'),
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
            path: '/settings',
            component: () => import('../components/settings/Settings.vue'),
        },
        {
            path: '/third-party-licenses',
            component: () => import('../components/license/ThirdPartyLicenses.vue'),
        },
        {
            path: "/:catchAll(.*)",
            redirect: "/"
        },
    ]
});

export default index;
