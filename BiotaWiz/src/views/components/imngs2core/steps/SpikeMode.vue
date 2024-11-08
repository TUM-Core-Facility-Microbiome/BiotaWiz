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
             class="flex cursor-pointer items-center justify-between rounded-lg border border-gray-300 bg-white p-4 text-sm font-medium shadow-sm hover:border-gray-200 peer-checked:border-blue-500 peer-checked:ring-1 peer-checked:ring-blue-500">
        <div class="flex items-center gap-2">
          <div class="relative">
            <div class="text-sm">Spike-in standard was added to <b>all</b> samples</div>
            <div class="text-xs text-gray-500">
              The output will be normalized by spike count. You must provide the amount of spike-ins and
              initial weight for all samples in the next step.
            </div>
            <div class="mt-2">
              <span class="whitespace-nowrap rounded-full bg-purple-100 px-2.5 py-0.5 text-sm text-purple-700 mr-1">spike removal</span>
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
             class="flex cursor-pointer items-center justify-between rounded-lg border border-gray-300 bg-white p-4 text-sm font-medium shadow-sm hover:border-gray-200 peer-checked:border-blue-500 peer-checked:ring-1 peer-checked:ring-blue-500">
        <div class="flex items-center gap-2">
          <div class="relative">
            <div class="text-sm">Partial: Spike-in standard was added to <b>some</b> of the samples</div>
            <div class="text-xs text-gray-500">
              The output will <b>not</b> be normalized by spike count for a mixed analysis.
            </div>
            <div class="mt-2">
              <span class="whitespace-nowrap rounded-full bg-purple-100 px-2.5 py-0.5 text-sm text-purple-700 mr-1">spike removal</span>
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
             class="flex cursor-pointer items-center justify-between rounded-lg border border-gray-300 bg-white p-4 text-sm font-medium shadow-sm hover:border-gray-200 peer-checked:border-blue-500 peer-checked:ring-1 peer-checked:ring-blue-500">
        <div class="flex items-center gap-2">
          <div class="relative">
            <div class="text-sm">Spike-in standards were <b>not used</b> for any of the samples</div>
            <div class="text-xs text-gray-500">
              Do not normalize by spike count.
              Spike sequences will be removed regardless to deal with possible spike-in contamination.
            </div>
            <div class="mt-2">
              <span class="whitespace-nowrap rounded-full bg-purple-100 px-2.5 py-0.5 text-sm text-purple-700 mr-1">spike removal</span>
            </div>
          </div>
        </div>
      </label>
    </div>
  </fieldset>
</template>

<script setup lang="ts">
import {reactive, ref, watchEffect} from "vue";
import {useRouter} from "vue-router";
import {SpikeMode} from "../../../../enums";


const router = useRouter();

const state = reactive({
  mode: "spiked",
});

const emit = defineEmits(['update:isValid']);
watchEffect(() => {
  emit('update:isValid', state.mode !== null);
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

async function rollback() {
  return
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