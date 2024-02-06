<template>
<p>Initializing backend ...</p>
</template>

<script setup lang="ts">
import {defineComponent, ref} from 'vue';
import {useRouter} from "vue-router";

const router = useRouter();

indexBridge.initializeBackend().then(() => {
  console.log("Backend initialized");
  router.push('/base-selection');
}).catch(() => {
  console.log("Backend initialization failed");
});
</script>

<script lang="ts">
import {defineComponent} from 'vue';

export default defineComponent({
  name: 'Startup',
});
</script>
