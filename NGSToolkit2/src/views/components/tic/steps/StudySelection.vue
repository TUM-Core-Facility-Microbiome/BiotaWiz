<template>
  <div>
    <h1 class="text-2xl font-semibold mb-4">Sample Browser</h1>
    <p class="mb-4">
      Please select the samples you want to analyze.
    </p>
    <StudyBrowser :base-dir="state.baseDir"/>
    <div class="bg-blue-100 border-t border-b border-blue-500 text-blue-700 px-4 py-3 mb-4 mt-10" role="alert">
      <p class="font-bold text-sm">Development notice:</p>
      <p class="text-xs">
        Currently, samples must follow the Illumina naming scheme to be detected.
        <br>
        A more flexible approach is planned for the final product (Issue #35).</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import StudyBrowser from "../../default/StudyBrowser.vue";
import {reactive} from "vue";

const state = reactive({
  baseDir: null as string | null,
});
</script>
