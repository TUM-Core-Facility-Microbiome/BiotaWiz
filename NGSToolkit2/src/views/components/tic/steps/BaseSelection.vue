<template>
  <div>
    <h1 class="text-2xl font-semibold mb-4">Base Directory</h1>
    <p class="mb-4">
      Select the base directory for the TIC pipeline.
      <br>
      This folder and/or its sub-folders should contain all sequence files you want to analyze in this run.
      Results of the pipeline will be written to the selected base folder.
    </p>
    <button
        class="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded"
        @click="selectBaseDir">Select Base Directory
    </button>
    <div v-if="state.baseDir" class="mt-4">
      <p>Selected:
        <div class="font-mono">{{ getFolderName(state.baseDir) }}</div>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import {reactive} from "vue";
import {useRouter} from "vue-router";

const router = useRouter();

const state = reactive({
  baseDir: null as string | null,
});

const selectBaseDir = () => {
  indexBridge.handleFolderOpen().then(async (baseDir: string) => {
    console.log("Base dir: ", baseDir);
    state.baseDir = baseDir;

    await indexBridge.publishTicBaseDirectory(baseDir);

    // navigate to the next step
    await router.push("/study-selection");
  }).catch(() => {
    console.log("Could not select base dir");
  });
}

const getFolderName = (path: string) => {
  const parts = path.split("/");
  return parts[parts.length - 1];
}
</script>
