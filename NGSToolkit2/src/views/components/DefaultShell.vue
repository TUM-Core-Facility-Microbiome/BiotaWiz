<template>
  <!--  Default Shell -->
  <div>
    <div class="w-screen max-w-2xl">
        <router-view class="left-16 m-3 relative mb-16"></router-view>
    </div>
    <ProgressBar />
  </div>
  <!-- Default Shell End -->
</template>

<script setup lang="ts">
import ProgressBar from "./default/ProgressBar.vue";
</script>
