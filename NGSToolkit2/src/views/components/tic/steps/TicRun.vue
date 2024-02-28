<template>
  <div class="p-4 text-xs font-mono bg-gray-800 text-white rounded-lg text-wrap w-100 max-h-80 min-h-80 overflow-y-auto"
       id="terminal">
    <p v-for="log of logLines" class="whitespace-pre-wrap">{{ log }}</p>
  </div>
</template>

<script setup lang="ts">
import {onMounted, ref} from "vue";
import {Environment} from "../../../../enums";

const logLines = ref<string[]>([]);

onMounted(() => {
  // prepare the environment
  indexBridge.runTicPipeline().then(() => {
    console.log("Tic pipeline running");
  }).catch(() => {
    console.log("Tic pipeline failed");
  });
});

indexBridge.handleLogsForEnvironment((environment: Environment, logMessage: string) => {
  if (environment === Environment.TIC) {
    console.log(logMessage);
    if (logMessage.startsWith('\r')) {
      logLines.value.pop();
    }
    logLines.value.push(logMessage);
    const terminal = document.getElementById("terminal");
    terminal.scrollTop = terminal.scrollHeight;
    // Scroll to the bottom with a slight delay to ensure the DOM updates fully
    setTimeout(() => {
      terminal.scrollTop = terminal.scrollHeight;
    }, 50);
  }
});
</script>
