import {createWebHashHistory, createRouter} from "vue-router";

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            redirect: '/startup',
        },
        {
            path: '/startup',
            component: () => import('./Startup.vue'),
        },
        {
            path: '/application-shell',
            component: () => import('./ApplicationShell.vue'),
            children: [
                {
                    path: '/preprocessing',
                    component: () => import('./Preprocessing.vue'),
                },
                {
                    path: '/settings',
                    component: () => import('./Settings.vue'),
                }
            ]
        },
        {
            path: "/:catchAll(.*)",
            redirect: "/"
        },
    ]
});

export default router;
