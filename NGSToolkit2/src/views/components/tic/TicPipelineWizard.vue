<template>
 <div>
    <div class="mb-2">
      <nav class="flex gap-6" aria-label="Tabs">
        <router-link to="/base-selection" class="shrink-0 rounded-lg p-2 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700" active-class="text-white bg-blue-500">Base selection</router-link>
        <router-link to="/study-selection" class="shrink-0 rounded-lg p-2 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700" active-class="text-white bg-blue-500">Study</router-link>
        <router-link to="/spike-mode" class="shrink-0 rounded-lg p-2 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700" active-class="text-white bg-blue-500">Spike-ins</router-link>
        <router-link to="/params" class="shrink-0 rounded-lg p-2 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700" active-class="text-white bg-blue-500">Parameters</router-link>
      </nav>
    </div>
  </div>

  <div class="container">
    <router-view></router-view>
  </div>
</template>

<script setup lang="ts">
</script>

<script lang="ts">
import {defineComponent} from 'vue';

export default defineComponent({
  name: 'TicPipelineWizzard',
});
</script>