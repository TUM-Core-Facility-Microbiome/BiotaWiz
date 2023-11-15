<template>
  <NavBar />
  <br>
  <div class="container">
    <router-view></router-view>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import NavBar from "./NavBar.vue";

export default defineComponent({
  name: 'ApplicationShell',
  components: {NavBar},
});
</script>