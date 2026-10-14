<template>
  <div v-if="isVisible" class="fixed bottom-4 right-4 z-50 max-w-sm bg-yellow-200 px-3 py-2 shadow-md rounded">
    <p class="text-sm font-medium text-yellow-800">
      <template v-if="state.update.status === 'available'">
        <strong>Update available:</strong> Version <strong>{{ state.update.version }}</strong> is available.
      </template>
      <template v-else-if="state.update.status === 'downloading'">
        Downloading version <strong>{{ state.update.version }}</strong>…
      </template>
      <template v-else-if="state.update.status === 'downloaded'">
        <strong>Update ready:</strong> Version <strong>{{ state.update.version }}</strong> will be installed when you restart.
      </template>
    </p>
    <div class="mt-2 flex gap-3 text-sm text-yellow-800">
      <template v-if="state.update.status === 'available'">
        <a v-if="state.update.canAutoInstall" @click="downloadUpdate" class="underline cursor-pointer font-semibold">Download and install</a>
        <a v-else @click="openReleasePage" class="underline cursor-pointer font-semibold">Open download page</a>
        <a @click="dismissUpdate" class="underline cursor-pointer">Later</a>
      </template>
      <template v-else-if="state.update.status === 'downloaded'">
        <a @click="installUpdate" class="underline cursor-pointer font-semibold">Restart now</a>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, reactive} from "vue";
import type {UpdateState} from "../../utils/updater";

const state = reactive({
  update: {status: 'idle'} as UpdateState,
});

const isVisible = computed(() => ['available', 'downloading', 'downloaded'].includes(state.update.status));

indexBridge.getUpdateState().then((update: UpdateState) => {
  state.update = update;
});

indexBridge.handleUpdateState((update: UpdateState) => {
  state.update = update;
});

function downloadUpdate() {
  indexBridge.downloadUpdate();
}

function openReleasePage() {
  indexBridge.openUpdateReleasePage();
}

function dismissUpdate() {
  indexBridge.dismissUpdate();
}

function installUpdate() {
  indexBridge.installUpdate();
}
</script>
