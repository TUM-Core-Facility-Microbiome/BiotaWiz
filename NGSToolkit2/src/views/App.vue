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
  console.log(`Route changed from ${from.path} to ${to.path}`);
});

indexBridge.handleChangeRouteTo((route: string) => {
  console.log(`Changing route to ${route}`);
  router.push(route);
});
</script>

<script lang="ts">
import {defineComponent} from 'vue';

export default defineComponent({
  name: 'App',
});
</script>
