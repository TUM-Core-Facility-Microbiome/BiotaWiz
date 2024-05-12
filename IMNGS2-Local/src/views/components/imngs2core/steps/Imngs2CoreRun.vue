<template>
  <div>
    <div class="text-lg font-bold">Running pipeline</div>
    <div class="text-sm text-gray-700">
      You should see the logs of IMNGS2-Core here. Output will be written to your selected base directory:
      <br>
      {{ state.baseDir }}
    </div>
    <p>
      <div v-if="state.analysisDir">
        <div class="flex">
          <div class="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <div>&nbsp;Analysis done. Analysis directory ready.</div>
        </div>
        <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" @click="openAnalysisDirectory">Open analysis directory</button>
      </div>
    </p>
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
  analysisDir: null as string | null,
});
const logLines = ref<string[]>([]);

onMounted(() => {
  getImngs2CoreBaseDirectory();
  // prepare the environment
  indexBridge.runImngs2Core().then(() => {
    console.log("IMNGS2-Core running");
  }).catch(() => {
    console.log("IMNGS2-Core pipeline failed");
  });
});

function getImngs2CoreBaseDirectory() {
  indexBridge.getImngs2CoreBaseDirectory().then((baseDir: string) => {
    console.log("Base dir: ", baseDir);
    state.baseDir = baseDir;
  }).catch(() => {
    console.log("Could not get base dir");
  });
}

function openAnalysisDirectory() {
  indexBridge.openImngs2CoreAnalysisDirectory();
}

const regex = /(?<asctime>[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2},[0-9]{3}) - (?<name>.*):(?<filename>.*):(?<lineno>[0-9]*) - (?<levelname>[A-Z]{4,5}) - (?<message>.*)/;

indexBridge.handleLogsForEnvironment((environment: Environment, logMessage: string) => {
  if (environment === Environment.IMNGS2CORE) {
    console.log(logMessage);

    let m;
    if ((m = regex.exec(logMessage)) !== null) {  // regex matches; regular log line
      if (m.groups?.message.startsWith("Analysis done. Results directory: ")) {
        state.analysisDir = m.groups?.message.replace("Analysis done. Results directory: ", "");
        indexBridge.publishImngs2CoreAnalysisDirectory(state.analysisDir);
      }
      // logMessage = `${m.groups?.asctime} - ${m.groups?.levelname} - ${m.groups?.message}`;
    } else {
      console.log(`does not match: ${logMessage}`);
    }

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
    await indexBridge.terminateImngs2CoreBackend();
  });
}

defineExpose({
  rollback,
});
</script>
