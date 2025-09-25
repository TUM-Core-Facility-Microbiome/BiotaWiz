<template>
  <!--  Default Shell -->
  <div>
    <div class="w-[98vw]">  <!-- to avoid horizontal scrollbar -->
      <div class="relative ml-16 mb-16 p-3">
          <router-view class="max-w-2xl mx-auto"></router-view>
      </div>
    </div>
    <ProgressBar/>
  </div>
  <!-- Default Shell End -->
</template>

<script setup lang="ts">
import ProgressBar from "./default/ProgressBar.vue";
</script>
