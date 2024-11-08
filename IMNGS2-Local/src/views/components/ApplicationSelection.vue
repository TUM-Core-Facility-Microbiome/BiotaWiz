<template>
  <div>
    <div>
      <div v-if="state.updateAvailable" class="bg-yellow-200 px-2 py-1 mb-2">
        <p class="text-sm font-medium text-yellow-800">
          <strong>Update available:</strong> A new version of <strong>{{ state.name }}</strong> is available. Please update to version <strong>{{ state.updateAvailable }}</strong>.
          <a @click="openUpdateInstructions" class="underline cursor-pointer">Click here to find out how.</a>
        </p>
      </div>
      <h1 class="text-2xl font-semibold mb-4">
        <div class="flex">
          <div>Select the analysis mode</div>
          <div class="ml-auto items-end justify-end select-text">
            <span class="rounded-xl bg-tic px-2 py-1 text-xs font-medium text-white"><strong>{{ state.name }}</strong> v{{ state.version }}</span>
          </div>
        </div>
      </h1>
      <p>
        <div v-if="state.backendAvailable === null">
          <div class="flex">
            <div class="w-5 h-5 bg-blue-500 rounded-full flex items-center relative">
              <svg class="animate-spin ml-0.5 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div>&nbsp;Checking backend...</div>
          </div>
        </div>
        <div v-if="state.backendAvailable === true">
          <div class="flex">
            <div class="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <div>&nbsp;Backend connected</div>
          </div>
        </div>
        <div v-if="state.backendAvailable === false">
          <div class="flex">
            <div class="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" stroke-width="1.5" class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path fill-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clip-rule="evenodd" />
              </svg>
            </div>
            <div>&nbsp;Could not connect to the backend!</div>
          </div>
          <div class="mt-3">
            <p>The backend is the underlying technology that executes a pipeline.</p>
            <p>
              The currently selected backend is <strong>{{ state.backendName }}</strong>.
              You can change the selected backend in the <router-link class="underline cursor-pointer text-blue-500" to="/settings/backend">Settings</router-link>.
            </p>
            <p class="mt-3" v-if="state.backendName == 'Docker'">
              Make sure your docker is installed, the docker daemon is running and that you can connect to it from the current account (e.g. your user should be added to the docker group).
            </p>
            <p class="mt-3">
              For Windows, we currently support Windows Subsystem for Linux [WSL2] (recommended) and Docker.
              For Linux, we support Docker.
            </p>
            <p class="mt-3">
              <strong>Please make sure a compatible backend is installed and running, and restart the application.</strong>
            </p>
          </div>
        </div>

      </p>
      <ul v-if="state.backendAvailable" class="mt-4 space-y-2">
        <li>
          <router-link to="/application-shell/imngs2core" class="block h-full rounded-lg border-2 border-gray-700 p-4 hover:border-tic" @click="setAnalysisMode(Imngs2CoreAnalysisMode.TIC)">
            <strong class="font-medium text-black">TIC (IMNGS2-Core)</strong>

            <p class="mt-1 text-xs font-medium text-gray-800">
              By choosing this option sequences of ZOTUs (unique, denoised and chimera-free sequences) from your selected samples will be gathered and passed to TIC algorithm for taxonomy-informed clustering.
            </p>
          </router-link>
        </li>
        <li>
          <router-link to="/application-shell/imngs2core" class="block h-full rounded-lg border-2 border-gray-700 p-4 hover:border-orange-400" @click="setAnalysisMode(Imngs2CoreAnalysisMode.DE_NOVO)">
            <strong class="font-medium text-black">De-novo Clustering</strong>

            <p class="mt-1 text-xs font-medium text-gray-800">
              By choosing this option quality-checked amplicons from your selected samples will be gathered, dereplicated, denoised, and cleaned for chimera and clustered using usearch 12.
            </p>
          </router-link>
        </li>
      </ul>
    </div>

  </div>
</template>
<script setup lang="ts">
import {reactive} from "vue";
import {Imngs2CoreAnalysisMode} from "../../enums";

// inform about env change
indexBridge.changeEnvironment(null);

const state = reactive({
  name: null as string | null,
  version: null as string | null,
  updateAvailable: null as string | null,
  backendAvailable: null as boolean | null,
  backendName: null,
});

function getName() {
  indexBridge.getName().then((name: string) => {
    state.name = name;
  });
}
function getVersion() {
  indexBridge.getVersion().then((version: string) => {
    state.version = version;
  });
}

function setBackendAvailable(available: boolean) {
  // introduce some small delay to show the spinner
  setTimeout(() => {
    state.backendAvailable = available;
  }, 300);
}

function getBackendInfo() {
  state.backendAvailable = null;

  // get backend name
  indexBridge.getBackend().then((backend: IBackend) => {
    state.backendName = backend.name;
    // get backend version
    indexBridge.checkBackendConnection().then(() => {
      console.log("Successfully connected to backend");
      setBackendAvailable(true);
    }).catch(() => {
      console.log("Could not connect to backend");
      setBackendAvailable(false);
    });
  }).catch(() => {
    console.log("Could not determine backend");
    state.backendName = null;
    setBackendAvailable(false);
  });
}

function checkForUpdate() {
  indexBridge.updateAvailable().then((latestTag: string) => {
    state.updateAvailable = latestTag;
  }).catch(() => {
    state.updateAvailable = null;
  });
}


getName();
getVersion();
getBackendInfo();
checkForUpdate();

function openUpdateInstructions() {
  const url = 'https://github.com/TUM-Core-Facility-Microbiome/IMNGS2-Core-docs/discussions/22';
  indexBridge.openExternalLink(url);
}

async function setAnalysisMode(mode: Imngs2CoreAnalysisMode) {
  await indexBridge.publishImngs2CoreAnalysisMode(mode);
}
</script>
