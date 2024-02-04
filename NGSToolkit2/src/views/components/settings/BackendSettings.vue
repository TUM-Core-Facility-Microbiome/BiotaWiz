<template>
  <div class="container">
    <div class="flow-root rounded-lg border border-gray-100 py-3 shadow-sm">
      <dl class="-my-3 divide-y divide-gray-100 text-sm">
        <div class="grid grid-cols-1 gap-1 p-3 even:bg-gray-50 sm:grid-cols-3 sm:gap-4">
          <dt class="font-medium text-gray-900">Detected OS</dt>
          <dd class="text-gray-700 sm:col-span-2">{{ state.platform }}</dd>
        </div>

        <div class="grid grid-cols-1 gap-1 p-3 even:bg-gray-50 sm:grid-cols-3 sm:gap-4">
          <dt class="font-medium text-gray-900">Backend</dt>
          <dd class="text-gray-700 sm:col-span-2">{{ state.backendName }}</dd>
        </div>

        <div class="grid grid-cols-1 gap-1 p-3 even:bg-gray-50 sm:grid-cols-3 sm:gap-4">
          <dt class="font-medium text-gray-900">Backend version</dt>
          <dd class="text-gray-700 sm:col-span-2">{{ state.backendVersion }}</dd>
        </div>
      </dl>
    </div>
  </div>
</template>

<script setup lang="ts">
import {reactive} from "vue";

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

// get backend name
indexBridge.getBackend().then((backend: IBackend) => {
  state.backendName = backend.name;
}).catch(() => {
  console.log("Could not determine backend");
  state.backendName = "unknown";
});

// get backend version
indexBridge.getBackendVersion().then((version: string) => {
  console.log("Backend version: ", version);
  state.backendVersion = version;
}).catch(() => {
  console.log("Could not determine backend version");
  state.backendVersion = "communication failed";
});

</script>
