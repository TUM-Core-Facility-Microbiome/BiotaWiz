<template>
  We recommend using Rhea for analyzing microbial profiles.

  <div class="mt-4">
    <a
        class="inline-block rounded border border-orange-500 px-12 py-3 text-sm font-semibold text-orange-500 hover:bg-orange-500 hover:text-white cursor-pointer"
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
