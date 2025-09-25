<template>
  <!-- Application Shell -->
  <router-view></router-view>
  <!-- Application Shell End -->
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import NavBar from "./default/navigation/NavBar.vue";

export default defineComponent({
  name: 'ApplicationShell',
  components: {NavBar},
});
</script>
