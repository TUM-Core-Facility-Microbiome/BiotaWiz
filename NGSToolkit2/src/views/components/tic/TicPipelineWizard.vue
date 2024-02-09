<template>
  <div class="relative">
    <div class="p-2 pb-4 max-w-lg mx-auto flex justify-center font-sans">
      <div>
        <h2 class="sr-only">Steps</h2>

        <div>
          <ol class="flex items-center gap-2 text-xs font-medium text-gray-500">
<!--            <li class="flex">-->
<!--            <span class="rounded bg-green-50 p-1.5 text-green-600">-->
<!--              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">-->
<!--                <path fill-rule="evenodd"-->
<!--                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"-->
<!--                      clip-rule="evenodd"></path>-->
<!--              </svg>-->
<!--            </span>-->
<!--            </li>-->
            <li>
              <router-link to="/base-selection" class="flex items-center justify-end gap-2" active-class="text-blue-600">
                <span class="w-6 h-6 rounded bg-gray-50 text-center text-[10px]/6 font-bold text-gray-600"> 1 </span>
                <span>Base</span>
              </router-link>
            </li>
            <li>
              <router-link to="/study-selection" class="flex items-center justify-end gap-2" active-class="text-blue-600">
                <span class="w-6 h-6 rounded bg-gray-50 text-center text-[10px]/6 font-bold text-gray-600"> 2 </span>
                <span>Study</span>
              </router-link>
            </li>
            <li>
              <router-link to="/spike-mode" class="flex items-center justify-end gap-2" active-class="text-blue-600">
                <span class="w-6 h-6 rounded bg-gray-50 text-center text-[10px]/6 font-bold text-gray-600"> 3 </span>
                <span>Spike-in</span>
              </router-link>
            </li>
            <li>
              <router-link to="/params" class="flex items-center justify-end gap-2" active-class="text-blue-600">
                <span class="w-6 h-6 rounded bg-gray-50 text-center text-[10px]/6 font-bold text-gray-600"> 4 </span>
                <span>Params</span>
              </router-link>
            </li>
          </ol>
        </div>
      </div>
    </div>
  </div>

<!-- <div>-->
<!--    <div class="mb-2">-->
<!--      <nav class="flex gap-6" aria-label="Tabs">-->
<!--        <router-link to="/base-selection" class="shrink-0 rounded-lg p-2 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700" active-class="text-white bg-blue-500">Base selection</router-link>-->
<!--        <router-link to="/study-selection" class="shrink-0 rounded-lg p-2 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700" active-class="text-white bg-blue-500">Study</router-link>-->
<!--        <router-link to="/spike-mode" class="shrink-0 rounded-lg p-2 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700" active-class="text-white bg-blue-500">Spike-ins</router-link>-->
<!--        <router-link to="/params" class="shrink-0 rounded-lg p-2 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700" active-class="text-white bg-blue-500">Parameters</router-link>-->
<!--      </nav>-->
<!--    </div>-->
<!--  </div>-->

  <div class="container">
    <router-view></router-view>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { Environment } from "../../../enums";

onMounted(() => {
  // prepare the environment
  indexBridge.initializeEnvironment(Environment.TIC).then(() => {
    console.log("Backend initialized 2");
  }).catch(() => {
    console.log("Backend initialization failed");
  });
});
</script>

<script lang="ts">
import {defineComponent} from 'vue';

export default defineComponent({
  name: 'TicPipelineWizzard',
});
</script>
