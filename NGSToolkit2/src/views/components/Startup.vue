<template>
  <p class="text-center">Running startup checks</p>
  <p>Detected OS: {{ state.platform }}</p>
  <p>Backend: {}</p>
</template>

<script setup lang="ts">
import {defineComponent} from 'vue';
import {useRouter} from "vue-router";
import {reactive} from "vue";

const router = useRouter();

const state = reactive({
  platform: "unknown"
});

// get platform name
indexBridge.getPlatformName().then((platform: string) => {
  state.platform = platform;
}).catch(() => {
  console.log("Could not determine platform");
  state.platform = "unknown";
});

indexBridge.runMockProcess().then((code: number) => {
    console.log("Process exited with code 0");
    router.push('/application-shell');
}).catch((code: number) => {
  console.log("Process failed with code " + code);
});
</script>

<script lang="ts">
import {defineComponent} from 'vue';

export default defineComponent({
  name: 'Startup',
});
</script>
