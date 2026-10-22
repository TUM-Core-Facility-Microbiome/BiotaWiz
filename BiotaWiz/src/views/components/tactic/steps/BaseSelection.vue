<template>
  <div>
    <div class="text-lg font-bold">Base Directory</div>
    <div class="text-sm text-gray-700">
      Select the base directory for the TACTIC pipeline.
      <br>
      This folder and/or its sub-folders should contain all sequence files you want to analyze in this run.
      Results of the pipeline will be written to the selected base folder.
    </div>
    <div class="mt-3 text-sm">
      <span v-if="pipeline.checking">Checking for the latest TACTIC pipeline version...</span>
      <span v-else-if="pipeline.version">
        TACTIC pipeline version: <strong>v{{ pipeline.version }}</strong>
        ({{ pipeline.pinned ? 'pinned version' : 'latest compatible version' }})
      </span>
    </div>
    <div v-if="pipeline.warning" role="alert" class="rounded border-s-4 border-yellow-500 bg-yellow-100 p-3 mt-2 text-sm text-yellow-800">
      {{ pipeline.warning }}
    </div>
    <div v-if="pipeline.error" role="alert" class="rounded border-s-4 border-red-500 bg-red-50 p-3 mt-2 text-sm text-red-800">
      Could not select a TACTIC pipeline version: {{ pipeline.error }}
      <a @click="selectPipelineVersion" class="underline cursor-pointer text-blue-500">Retry</a>
    </div>
  </div>
  <div>
    <button
        class="mt-3 bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-1 px-4 border border-blue-500 hover:border-transparent rounded"
        @click="selectBaseDir">Select Base Directory
    </button>
    <div v-if="state.baseDir" class="mt-4">
      <p class="text-sm">Selected:
        <div class="font-mono text-wrap break-words">{{ state.baseDir }}</div>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import {reactive, watchEffect} from "vue";
import {useRouter} from "vue-router";
import {Environment} from "../../../../enums";

const router = useRouter();

const state = reactive({
  isValid: false,
  baseDir: null as string | null,
});

const pipeline = reactive({
  checking: false,
  version: null as string | null,
  pinned: false,
  warning: null as string | null,
  error: null as string | null,
});

const emit = defineEmits(['update:isValid']);
watchEffect(() => {
  // continue only once a pipeline version is selected
  emit('update:isValid', state.isValid && pipeline.version !== null);
});

/**
 * Check which pipeline version to use. Runs each time the user starts from this first step;
 * all later steps use the selected version.
 */
function selectPipelineVersion() {
  pipeline.checking = true;
  pipeline.version = null;
  pipeline.warning = null;
  pipeline.error = null;
  indexBridge.selectPipelineVersion(Environment.TACTIC).then((selection) => {
    pipeline.version = selection.version;
    pipeline.pinned = selection.pinned;
    pipeline.warning = selection.warning;
  }).catch((error: Error) => {
    // remove the prefix Electron adds to errors of IPC calls
    pipeline.error = String(error?.message ?? error).replace(/^Error invoking remote method '[^']*': (Error: )?/, '');
  }).finally(() => {
    pipeline.checking = false;
  });
}

selectPipelineVersion();

async function apply() {
  return new Promise<void>((resolve, reject) => {
    indexBridge.publishTacticBaseDirectory(state.baseDir).then(() => {
        resolve();
    }).catch(() => {
        reject();
    });
  });
}

const selectBaseDir = () => {
  indexBridge.handleFolderOpen().then(async (baseDir: string) => {
    console.log("Base dir: ", baseDir);
    state.baseDir = baseDir;
    state.isValid = true;
  }).catch(() => {
    console.log("Could not select base dir");
    state.baseDir = null;
    state.isValid = false;
  });
}

const getFolderName = (path: string) => {
  const parts = path.split("/");
  return parts[parts.length - 1];
}

defineExpose({
  apply,
});
</script>
