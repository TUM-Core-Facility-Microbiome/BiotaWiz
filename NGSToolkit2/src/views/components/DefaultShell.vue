<template>
  <div>
    <div class="w-screen max-w-2xl">
        <router-view class="container left-16 m-3 relative mb-16"></router-view>
    </div>
    <ProgressBar />
  </div>
</template>

<script setup lang="ts">
import ProgressBar from "./default/ProgressBar.vue";
</script>
