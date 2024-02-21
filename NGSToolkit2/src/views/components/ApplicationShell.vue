<template>
  <!-- Application Shell -->
  <!--  <NavBar/>-->
  <div class="container left-16 m-3 relative mb-16">
    <router-view></router-view>
  </div>
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