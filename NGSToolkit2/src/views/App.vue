<template>
  <h1 class="text-3xl font-bold underline">💖 Hello World!</h1>
  <p>Welcome to your Electron + Vue3 application.</p>
  <p>Running on {{state.platform}}</p>
</template>

<script setup>
import {reactive} from "vue";

const state = reactive({
  platform: "unknown OS"
});


console.log('👋 This message is being logged by "App.vue", included via Vite');
indexBridge.runMockProcess().then(() => {
  console.log("Mock process returned");
});
indexBridge.getPlatformName().then((platform) => {
  console.log("Platform name returned");
  console.log(platform);
  state.platform = platform;
});
</script>
