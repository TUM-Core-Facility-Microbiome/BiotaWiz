<template>
  <div class="container min-w-40">
    <h3>General</h3>
    <div class="mt-4 text-s">
      <span class="font-mono">{{ state.appName }} v{{ state.appVersion }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import {reactive} from "vue";

const state = reactive({
  appName: null as string | null,
  appVersion: null as string | null,
});

function updateState() {
  // reset displayed outputs
  state.appName = null;
  state.appVersion = null;

  // get app name
  indexBridge.getName().then((appName: string) => {
    state.appName = appName;
  }).catch(() => {
    console.log("Could not determine app name");
    state.appName = "unknown";
  });

  // get app version
  indexBridge.getVersion().then((version: string) => {
    console.log("App version: ", version);
    state.appVersion = version;
  }).catch(() => {
    console.log("Could not determine app version");
    state.appVersion = "communication failed";
  });
}

updateState();
</script>
