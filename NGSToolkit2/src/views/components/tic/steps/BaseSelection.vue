<template>
  <div>
    <h1 class="text-2xl font-semibold mb-4">Study Browser</h1>
    <button class="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded" @click="selectBaseDir">Select Base Directory</button>
    <div v-if="state.baseDir" class="mt-4">
      <p>Selected: <div class="font-mono">{{ getFolderName(state.baseDir) }}</div></p>
    </div>
  </div>
</template>

<script setup lang="ts">
import StudyBrowser from "../../default/StudyBrowser.vue";
import { reactive } from "vue";

const state = reactive({
  baseDir: null as string | null,
});

const selectBaseDir = () => {
  indexBridge.handleFolderOpen().then((baseDir: string) => {
    console.log("Base dir: ", baseDir);
    state.baseDir = baseDir;
  }).catch(() => {
    console.log("Could not select base dir");
  });
}

const getFolderName = (path: string) => {
  const parts = path.split("/");
  return parts[parts.length - 1];
}
</script>