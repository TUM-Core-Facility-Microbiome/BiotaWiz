<template>
  <div>
    <div class="flex-grow">
      <div class="container left-16 m-3 relative mb-16">
        <router-view></router-view>
      </div>
    </div>
    <ProgressBar />
  </div>
</template>

<script setup lang="ts">
import ProgressBar from "./default/ProgressBar.vue";
</script>
