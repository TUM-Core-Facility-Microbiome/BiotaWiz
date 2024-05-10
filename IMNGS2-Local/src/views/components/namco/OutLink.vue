<template>
  We recommend using Namco, the free Microbiome Explorer for your downstream processing of microbial profiles.

  <div class="mt-4">
    <a
        class="inline-block rounded border border-orange-500 px-12 py-3 text-sm font-semibold text-orange-500 hover:bg-orange-500 hover:text-white cursor-pointer"
        @click="openInDefaultBrowser('https://exbio.wzw.tum.de/namco/')"
    >
      Open Namco
    </a>
  </div>

</template>

<script setup lang="ts">
import {Environment} from "../../../enums";

async function openInDefaultBrowser(url: string) {
  await indexBridge.openExternal(url);
}

// indexBridge.initializeEnvironment(Environment.SHINY_RHEA).then(() => {
//   console.log("Backend initialized");
// }).catch(() => {
//   console.log("Backend initialization failed");
// });
</script>
