<template>
  <div>
    <div class="text-lg font-bold">Spike-in standard</div>
    <div class="text-sm text-gray-700">
      Select if spiked-in standards were used for the samples selected in the previous step.
    </div>
  </div>
  <fieldset class="space-y-2">
    <legend class="sr-only">Spike Mode Selection</legend>

    <div>
      <input
          type="radio"
          v-model="state.mode"
          value="spiked"
          id="spike-mode-select-spiked"
          class="peer hidden [&:checked_+_label_svg]:block"
          checked
      />

      <label for="spike-mode-select-spiked"
             class="flex cursor-pointer items-center justify-between rounded-lg border border-gray-300 bg-white p-3 text-sm font-medium shadow-sm hover:border-gray-200 peer-checked:border-blue-500 peer-checked:ring-1 peer-checked:ring-blue-500">
        <div class="flex items-center gap-2">
          <div class="relative">
            <div class="text-sm">Spike-in standard was added to <b>all</b> samples</div>
            <div class="text-xs text-gray-500">
              The output will be normalized by spike count. You must provide the amount of spike-ins and
              initial weight for all samples. Using this option will open an Excel file. Please fill it in and save it.
            </div>
            <div class="mt-2">
              <span class="whitespace-nowrap rounded-full bg-emerald-100 px-2.5 py-0.5 text-sm text-emerald-700 mr-1">spike normalization</span>
            </div>
          </div>
        </div>
      </label>
    </div>

    <div>
      <input
          type="radio"
          v-model="state.mode"
          value="partial"
          id="spike-mode-select-partial"
          class="peer hidden [&:checked_+_label_svg]:block"
      />

      <label for="spike-mode-select-partial"
             class="flex cursor-pointer items-center justify-between rounded-lg border border-gray-300 bg-white p-3 text-sm font-medium shadow-sm hover:border-gray-200 peer-checked:border-blue-500 peer-checked:ring-1 peer-checked:ring-blue-500">
        <div class="flex items-center gap-2">
          <div class="relative">
            <div class="text-sm">Partial: Spike-in standard was added to <b>some</b> of the samples</div>
            <div class="text-xs text-gray-500">
              The output will <b>not</b> be normalized by spike count for a mixed analysis.
            </div>
          </div>
        </div>
      </label>
    </div>

    <div>
      <input
          type="radio"
          v-model="state.mode"
          value="none"
          id="spike-mode-select-none"
          class="peer hidden [&:checked_+_label_svg]:block"
      />

      <label for="spike-mode-select-none"
             class="flex cursor-pointer items-center justify-between rounded-lg border border-gray-300 bg-white p-3 text-sm font-medium shadow-sm hover:border-gray-200 peer-checked:border-blue-500 peer-checked:ring-1 peer-checked:ring-blue-500">
        <div class="flex items-center gap-2">
          <div class="relative">
            <div class="text-sm">Spike-in standards were <b>not used</b> for any of the samples</div>
            <div class="text-xs text-gray-500">
              Do not normalize by spike count.
              Spike sequences will be removed regardless to deal with possible spike-in contamination.
            </div>
          </div>
        </div>
      </label>
    </div>
  </fieldset>
  <div>
    <div class="text-lg font-bold mt-4">Spike-in sequences removal</div>
    <div class="text-sm text-gray-700">
      Spike-in sequences are <b>removed from all samples</b>, to avoid possible contamination.
      <br>You may select your own spike-in sequences as a folder of FASTA files. Please place the folder inside the Base Directory.
    </div>
    <div>
      <button
          class="mt-3 bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-1 px-4 border border-blue-500 hover:border-transparent rounded"
          @click="selectSpikeDir">Use custom spike-in sequences
      </button>
      <div v-if="state.selectedSpikeDirNotInBase" class="mt-1 text-sm text-red-500">
        Selected spike-in sequence directory is not a sub-directory of the Base Directory (<span class="font-mono text-wrap break-words">{{state.baseDir}}</span>). Please select a valid directory.
      </div>
      <div v-if="state.spikeDir" class="mt-1">
        <p class="text-sm">Selected: <span class="font-mono text-wrap break-words">{{ state.spikeDir }}</span>
        </p>
      </div>
      <div v-else class="mt-1 text-sm text-gray-500">
        No spike-in sequence directory selected. Default, synthetic spike-in sequences (<a @click="openExternal('https://doi.org/10.1093/nar/gkw984')" class="underline cursor-pointer text-blue-500">Tourlousse et al. 2017</a>), as used by the TUM CFM will be used.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {reactive, ref, watchEffect} from "vue";
import {useRouter} from "vue-router";
import {SpikeMode} from "../../../../enums";


const router = useRouter();

const state = reactive({
  mode: "spiked",
  baseDir: null as string | null,
  selectedSpikeDirNotInBase: false,
  spikeDir: null as string | null,
});

const emit = defineEmits(['update:isValid']);
watchEffect(() => {
  emit('update:isValid', state.mode !== null && state.selectedSpikeDirNotInBase === false);
});

async function apply() {
  return new Promise<void>((resolve, reject) => {
    indexBridge.publishSpikeMode(state.mode).then(() => {
      resolve();
    }).catch(() => {
      reject();
    });
  });
}

const selectSpikeDir = () => {
  indexBridge.getTacticBaseDirectory().then((baseDir: string) => {
    console.log("Base dir: ", baseDir);
    state.baseDir = baseDir;

    indexBridge.handleFolderOpen(baseDir).then(async (spikeDir: string) => {
      console.log("Base dir: ", baseDir);
      console.log("Spike dir: ", spikeDir);

      // check if the spikeDir is a subdirectory of the baseDir
      if (spikeDir.startsWith(baseDir) && spikeDir.length > baseDir.length) {
        const relativePath = spikeDir.substring(baseDir.length);
        console.log("Relative path: ", relativePath);
        state.spikeDir = relativePath.startsWith("/") ? relativePath.substring(1) : relativePath;
        indexBridge.publishSpikeInSequencesDirectory(state.spikeDir).catch(() => {
          console.log("Could not publish spike dir");
        });
        state.selectedSpikeDirNotInBase = false;
      } else {
        state.spikeDir = null;
        state.selectedSpikeDirNotInBase = true;
      }
    }).catch(() => {
      console.log("Could not select spike dir");
      state.spikeDir = null;
    });
  }).catch(() => {
    console.log("Could not get base dir");
  });
}

async function rollback() {
  return
}

function openExternal(url: string) {
  indexBridge.openExternalLink(url);
}

defineExpose({
  apply,
  rollback,
});
</script>

<script lang="ts">
import {defineComponent} from 'vue';

export default defineComponent({
  name: 'SpikeMode',
});
</script>