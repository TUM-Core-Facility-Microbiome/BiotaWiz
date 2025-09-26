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
                            redirect: '/application-shell/tactic',
                        },
                        {
                            path: '/application-shell/tactic',
                            component: () => import('../components/tactic/VersionChooser.vue'),
                        },
                        {
                            path: '/application-shell/tactic/steps',
                            name: 'tactic-wizard',
                            component: () => import('../components/tactic/TacticWizard.vue'),
                            redirect: '/application-shell/tactic/steps/base-selection',
                            children: [
                                {
                                    path: '/application-shell/tactic/steps/base-selection',
                                    component: () => import('../components/tactic/steps/BaseSelection.vue'),
                                },
                                {
                                    path: '/application-shell/tactic/steps/study-selection',
                                    component: () => import('../components/tactic/steps/StudySelection.vue'),
                                },
                                {
                                    path: '/application-shell/tactic/steps/spike-mode',
                                    component: () => import('../components/tactic/steps/SpikeMode.vue'),
                                },
                                {
                                    path: '/application-shell/tactic/steps/check-mapping',
                                    component: () => import('../components/tactic/steps/CheckMappingFile.vue'),
                                },
                                {
                                    path: '/application-shell/tactic/steps/params',
                                    component: () => import('../components/tactic/steps/Parameters.vue'),
                                },
                                {
                                    path: '/application-shell/tactic/steps/run',
                                    component: () => import('../components/tactic/steps/TacticRun.vue'),
                                },
                            ]
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
                            path: '/settings/environment/tactic',
                            component: () => import('../components/settings/environments/TacticEnvironmentSettings.vue'),
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
