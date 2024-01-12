<template>
  <p class="text-center">Running startup checks</p>
  <p>Detected OS: {{ state.platform }}</p>
  <p>Backend: {{ state.backendName }}</p>
  <p>Backend Version: {{ state.backendVersion }}</p>
</template>

<script setup lang="ts">
import {defineComponent} from 'vue';
import {useRouter} from "vue-router";
import {reactive} from "vue";

const router = useRouter();

const state = reactive({
  platform: "unknown",
  backendName: "unknown",
  backendVersion: "loading",
});

// get platform name
indexBridge.getPlatformName().then((platform: string) => {
  state.platform = platform;
}).catch(() => {
  console.log("Could not determine platform");
  state.platform = "unknown";
});

indexBridge.getBackend().then((backend: IBackend) => {
  console.log("Backend: " , backend);
  state.backendName = backend.name;
}).catch(() => {
  console.log("Could not determine backend");
  state.backendName = "unknown";
});

indexBridge.getBackendVersion().then((version: string) => {
  console.log("Backend version: " , version);
  state.backendVersion = version;
}).catch(() => {
  console.log("Could not determine backend version");
  state.backendVersion = "communication failed";
});

indexBridge.initializeBackend().then(() => {
  console.log("Backend initialized");
  router.push('/application-shell');
}).catch(() => {
  console.log("Backend initialization failed");
});
</script>

<script lang="ts">
import {defineComponent} from 'vue';

export default defineComponent({
  name: 'Startup',
});
</script>
