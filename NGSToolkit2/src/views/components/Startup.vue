<template>
  <p class="text-center">Running startup checks</p>
</template>

<script setup lang="ts">
// navigate to application shell after 5 second
import {defineComponent} from 'vue';
import {useRouter} from "vue-router";

const router = useRouter();
setTimeout(() => {
  router.push('/application-shell');
}, 5000);
</script>

<script lang="ts">
import {defineComponent} from 'vue';

export default defineComponent({
  name: 'Startup',
});
</script>
