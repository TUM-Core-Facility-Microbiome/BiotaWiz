<template>
  <div class="flex">
    <MainNavigation></MainNavigation>
    <router-view></router-view>
    <UpdateBanner></UpdateBanner>
  </div>
</template>

<script setup lang="ts">
// listen to the main process 'changeRouteTo' event to allow navigation from Menu click events
import router from "./router";
import MainNavigation from "./components/default/navigation/MainNavigation.vue";
import UpdateBanner from "./components/UpdateBanner.vue";

// on router changes log
router.afterEach((to, from) => {
  console.debug(`Route changed from ${from.fullPath} to ${to.fullPath}`);
});

indexBridge.handleChangeRouteTo((route: string) => {
  console.debug(`Main world requested route change to ${route}`);
  // check if route is current route
  if (router.currentRoute.value.fullPath === route) {
    console.debug(`Route ${route} is current route, not changing`);
    return;
  }
  router.push(route);
});

indexBridge.handleLogRequests((message: string, level: string) => {
  if (level == 'trace') {
    console.trace(message);
  } else if (level == 'debug') {
    console.debug(message);
  } else if (level == 'info') {
    console.info(message);
  } else if (level == 'warn') {
    console.warn(message);
  } else if (level == 'error') {
    console.error(message);
  } else {
    console.log(message);
  }
});
</script>

<script lang="ts">
import {defineComponent} from 'vue';

export default defineComponent({
  name: 'App',
});
</script>
