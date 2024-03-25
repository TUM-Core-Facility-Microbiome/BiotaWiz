<template>
  <div>
    <div class="text-lg font-bold">Sample Browser</div>
    <div class="text-sm text-gray-700">
      Please select the samples you want to analyze. You can expand folders by clicking on the name.
    </div>
  </div>
  <div>
    <StudyBrowser :base-dir="state.baseDir"/>
    <div class="bg-blue-100 border-t border-b border-blue-500 text-blue-700 px-4 py-3 mb-4 mt-10" role="alert">
      <p class="font-bold text-sm">Development notice:</p>
      <p class="text-xs">
        Currently, samples must follow the Illumina naming scheme and be paired to be detected.
        <br>
        A more flexible approach is planned for the final application (Issue #35).</p>
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
