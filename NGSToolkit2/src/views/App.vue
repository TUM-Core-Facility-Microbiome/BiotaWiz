<template>
  <div class="container">
    <router-view></router-view>
  </div>
</template>

<script setup lang="ts">
// listen to the main process 'changeRouteTo' event to allow navigation from Menu click events
import router from "./router";

// on router changes log
router.afterEach((to, from) => {
  console.debug(`Route changed from ${from.path} to ${to.path}`);
});

indexBridge.handleChangeRouteTo((route: string) => {
  console.debug(`Main world requested route change to ${route}`);
  // check if route is current route
  if (router.currentRoute.value.path === route) {
    console.debug(`Route ${route} is current route, not changing`);
    return;
  }
  router.push(route);
});
</script>

<script lang="ts">
import {defineComponent} from 'vue';

export default defineComponent({
  name: 'App',
});
</script>
