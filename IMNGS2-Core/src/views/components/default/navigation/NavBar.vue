<template>
  <ul class="flex">
    <li class="flex-1 mr-2">
      <router-link to="/application-shell/tic" class="header nav">TIC pipeline</router-link>
    </li>
    <li class="flex-1 mr-2">
      <router-link to="/application-shell/rhea" class="header nav" href="#">Rhea</router-link>
    </li>
  </ul>
</template>

<style scoped>
.header.nav {
  @apply text-center block border border-white rounded hover:border-gray-200 text-blue-500 hover:bg-gray-200 py-2 px-4
}

.header.nav.router-link-active {
  @apply text-center block border border-blue-500 rounded py-2 px-4 bg-blue-500 hover:bg-blue-700 text-white
}
</style>

<script setup lang="ts">
</script>

<script lang="ts">
import {defineComponent} from 'vue';

export default defineComponent({
  name: 'NavBar',
});
</script>
