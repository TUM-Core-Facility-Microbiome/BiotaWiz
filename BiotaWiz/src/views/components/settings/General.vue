<template>
  <div class="container">
    <div class="flex-1 lg:max-w-2xl">
      <div class="space-y-6">
        <div>
          <h3 class="text-lg font-medium">About</h3>
          <p class="text-sm text-muted-foreground">Application: {{ state.appName }} v{{ state.appVersion }}</p>
          <br>
          <h4 class="text-lg font-medium">Updates:</h4>
          <div class="flex items-center gap-3">
            <button @click="checkForUpdates" :disabled="state.updateStatus === 'checking'"
                    class="rounded bg-tic px-3 py-1 text-sm font-medium text-white disabled:opacity-50">
              Check for updates
            </button>
            <span class="text-sm text-muted-foreground">{{ updateStatusText }}</span>
          </div>
          <label class="mt-2 flex items-center gap-2 text-sm">
            <input type="checkbox" v-model="state.autoUpdateCheck" @change="setAutoUpdateCheck">
            Automatically check for updates
          </label>
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
import {computed, onUnmounted, reactive} from "vue";
import type {UpdateState} from "../../../utils/updater";

const state = reactive({
  appName: null as string | null,
  appVersion: null as string | null,
  updateStatus: 'idle' as UpdateState['status'],
  autoUpdateCheck: true,
});

const updateStatusText = computed(() => {
  switch (state.updateStatus) {
    case 'checking':
      return 'Checking…';
    case 'up-to-date':
      return 'You are using the latest version.';
    case 'available':
      return 'A new version is available.';
    case 'downloading':
      return 'Downloading update…';
    case 'downloaded':
      return 'Update ready. Restart to apply.';
    case 'error':
      return 'Could not check for updates.';
    default:
      return '';
  }
});

function checkForUpdates() {
  indexBridge.checkForUpdates();
}

function setAutoUpdateCheck() {
  indexBridge.setAutoUpdateCheck(state.autoUpdateCheck);
}

indexBridge.getUpdateState().then((update: UpdateState) => {
  state.updateStatus = update.status;
});
const removeUpdateStateListener = indexBridge.handleUpdateState((update: UpdateState) => {
  state.updateStatus = update.status;
});
onUnmounted(removeUpdateStateListener);

indexBridge.getAutoUpdateCheck().then((enabled: boolean) => {
  state.autoUpdateCheck = enabled;
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
