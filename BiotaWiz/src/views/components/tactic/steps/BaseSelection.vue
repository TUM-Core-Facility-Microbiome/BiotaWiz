<template>
  <div>
    <div class="text-lg font-bold">Base Directory</div>
    <div class="text-sm text-gray-700">
      Select the base directory for the TACTIC pipeline.
      <br>
      This folder and/or its sub-folders should contain all sequence files you want to analyze in this run.
      Results of the pipeline will be written to the selected base folder.
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

const router = useRouter();

const state = reactive({
  isValid: false,
  baseDir: null as string | null,
});

const emit = defineEmits(['update:isValid']);
watchEffect(() => {
  emit('update:isValid', state.isValid);
});

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
