<template>
  <div>
    <div class="text-lg font-bold">Running pipeline</div>
    <div class="text-sm text-gray-700">
      You should see the logs of the TIC pipeline here. Output will be written to your selected base directory:
      <br>
      {{ state.baseDir }}
    </div>
  </div>
  <br>
  <div class="p-4 text-xs font-mono bg-gray-800 text-white rounded-lg text-wrap w-100 max-h-80 min-h-80 overflow-y-auto"
       id="terminal">
    <p v-for="log of logLines" class="whitespace-pre-wrap">{{ log }}</p>
  </div>
</template>

<script setup lang="ts">
import {onMounted, ref, reactive} from "vue";
import {Environment} from "../../../../enums";

const state = reactive({
  baseDir: null as string | null,
});
const logLines = ref<string[]>([]);

onMounted(() => {
  getTicBaseDirectory();
  // prepare the environment
  indexBridge.runTicPipeline().then(() => {
    console.log("Tic pipeline running");
  }).catch(() => {
    console.log("Tic pipeline failed");
  });
});

function getTicBaseDirectory() {
  indexBridge.getTicBaseDirectory().then((baseDir: string) => {
    console.log("Base dir: ", baseDir);
    state.baseDir = baseDir;
  }).catch(() => {
    console.log("Could not get base dir");
  });
}

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

async function rollback() {
  return new Promise<void>(async (resolve, reject) => {
    await indexBridge.terminateTicBackend();
  });
}

defineExpose({
  rollback,
});
</script>
