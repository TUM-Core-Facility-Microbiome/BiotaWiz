<template>
  <div class="container">
    <div class="flow-root rounded-lg border border-gray-100 py-3 shadow-sm">
      <dl class="-my-3 divide-y divide-gray-100 text-sm">
        <div class="grid grid-cols-1 gap-1 p-3 even:bg-gray-50 sm:grid-cols-3 sm:gap-4">
          <dt class="font-medium text-gray-900">Detected platform</dt>
          <dd class="text-gray-700 sm:col-span-2">{{ state.platform }}</dd>
        </div>

        <div class="grid grid-cols-1 gap-1 p-3 even:bg-gray-50 sm:grid-cols-3 sm:gap-4">
          <dt class="font-medium text-gray-900">Backend</dt>
          <dd class="text-gray-700 sm:col-span-2">{{ state.backendName }}</dd>
        </div>

        <div class="grid grid-cols-1 gap-1 p-3 even:bg-gray-50 sm:grid-cols-3 sm:gap-4">
          <dt class="font-medium text-gray-900">Backend version</dt>
          <dd class="text-gray-700 sm:col-span-2 whitespace-pre-line">{{ state.backendVersion }}</dd>
        </div>
      </dl>
    </div>

    <!-- Backend selector -->
    <div class="mt-4">
      <label for="backend" class="block text-sm font-medium text-gray-700">Select Backend</label>
      <select @change="setBackend($event.target.value)">
        <option value="default">Platform default</option>
        <option value="Docker">Docker</option>
        <option value="WSL">WSL2</option>
      </select>
    </div>

    <button @click="resetBackend" class="bg-red-500 hover:bg-red-700 text-white py-2 px-4 rounded mt-4">
      Reset to Default Backend
    </button>
  </div>
</template>

<script setup lang="ts">
import {reactive} from "vue";

const state = reactive({
  platform: null,
  backendName: null,
  backendVersion: null,
});

function updateState() {
  // reset displayed outputs
  state.platform = null;
  state.backendName = null;
  state.backendVersion = null;

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
}

updateState();

function setBackend(backendType: string) {
  indexBridge.setBackendByType(backendType).then(() => {
    console.log("Backend set");
    updateState();
  }).catch(() => {
    console.log("Could not set backend");
  });
}

function resetBackend() {
  indexBridge.resetBackend().then(() => {
    console.log("Backend reset");
    updateState();
  }).catch(() => {
    console.log("Could not reset backend");
  });
}

</script>
