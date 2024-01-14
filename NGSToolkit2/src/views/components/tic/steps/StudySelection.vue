<template>
  <div>
    <h1 class="text-2xl font-semibold mb-4">Study Browser</h1>
    <StudyBrowser :base-dir="state.baseDir"/>
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
