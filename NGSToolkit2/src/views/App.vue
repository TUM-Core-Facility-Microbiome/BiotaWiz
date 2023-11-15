<template>
  <h1 class="text-3xl font-bold underline">💖 Hello World!</h1>
  <p>Welcome to your Electron + Vue3 application.</p>
  <p>Running on {{state.platform}}</p>
  <button class="btn btn-blue" type="button" id="btn" @click="handleClick">Choose a folder</button>
  <p v-if="state.path">Path: <strong class="break-normal sm:break-words md:break-all lg:truncate xl:break-normal ...">{{state.path}}</strong></p>
</template>

<script setup>
import {reactive} from "vue";

const state = reactive({
  platform: "unknown OS",
  path: null,
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


function handleClick() {
  indexBridge.handleFolderOpen().then((path) => {
    console.log("Path returned");
    console.log(path);
    state.path = path;
  }).catch((err) => {
    console.log(err);
    state.path = null;
  });
}

</script>
