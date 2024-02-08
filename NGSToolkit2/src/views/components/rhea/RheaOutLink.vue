<template>
  We recommend using Rhea for analyzing microbial profiles.

  <div class="mt-4">
    <a
        class="inline-block rounded border border-indigo-600 px-12 py-3 text-sm font-medium text-indigo-600 hover:bg-indigo-600 hover:text-white focus:outline-none focus:ring active:bg-indigo-500"
        @click="openInDefaultBrowser('https://lagkouvardos.github.io/Rhea/')"
    >
      Find out more
    </a>
  </div>

</template>

<script setup lang="ts">
import {Environment} from "../../../enums";

async function openInDefaultBrowser(url: string) {
  await indexBridge.openExternal(url);
}

indexBridge.initializeEnvironment(Environment.SHINY_RHEA).then(() => {
  console.log("Backend initialized");
}).catch(() => {
  console.log("Backend initialization failed");
});
</script>
