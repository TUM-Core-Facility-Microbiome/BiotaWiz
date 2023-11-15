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
            component: () => import('../components/Startup.vue'),
        },
        {
            path: '/application-shell',
            component: () => import('../components/ApplicationShell.vue'),
            children: [
                {
                    path: '/',
                    redirect: '/preprocessing',
                },
                {
                    path: '/preprocessing',
                    component: () => import('../components/Preprocessing.vue'),
                },
                {
                    path: '/analysis',
                    component: () => import('../components/Analysis.vue'),
                }
            ]
        },
        {
            path: '/settings',
            component: () => import('../components/Settings.vue'),
        },
        {
            path: "/:catchAll(.*)",
            redirect: "/"
        },
    ]
});

export default index;
