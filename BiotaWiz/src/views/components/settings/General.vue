<template>
  <div class="container">
    <div class="flex-1 lg:max-w-2xl">
      <div class="space-y-6">
        <div>
          <h3 class="text-lg font-medium">About</h3>
          <p class="text-sm text-muted-foreground">Application: {{ state.appName }} v{{ state.appVersion }}</p>
          <br>
          <h4 class="text-lg font-medium">Developed by:</h4>
          <p class="text-sm text-muted-foreground">GUI Application Author: Zeno Sewald</p>
          <p class="text-sm text-muted-foreground">Analysis pipeline author: Mohsen Pourjam</p>
          <p class="text-sm text-muted-foreground">Principal investigator: Ilias Lagkouvardos</p>
          <br>
          <h4>Acknowledgements:</h4>
          <p class="text-sm text-muted-foreground">This application uses open source dependencies. Please refer to the
          <router-link to="/third-party-licenses" class="text-blue-600 hover:underline">third party licenses</router-link>
          page for more information.</p>
        </div>
      </div>
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
