<template>
  <div>
    <div class="text-lg font-bold">USEARCH Binary</div>
    <div class="text-sm text-gray-700">
      The TIC pipeline is based on USEARCH 11. Due to USEARCH's licensing we can not include the binary in the
      pipeline environment. Please select how you want to proceed.
    </div>
  </div>
  <fieldset class="space-y-2">
    <legend class="sr-only">USEARCH selection</legend>

    <div>
      <input
          type="radio"
          v-model="usearch"
          value="download"
          id="usearch-select-download"
          class="peer hidden [&:checked_+_label_svg]:block"
          checked
      />

      <label for="usearch-select-download"
             class="flex cursor-pointer items-center justify-between rounded-lg border border-gray-300 bg-white p-4 text-sm font-medium shadow-sm hover:border-gray-200 peer-checked:border-blue-500 peer-checked:ring-1 peer-checked:ring-blue-500">
        <div class="flex items-center gap-2">
          <div class="relative">
            <div class="text-sm">Download a copy of USEARCH 11 for me (32-bit)</div>
            <div class="text-xs text-gray-500">
              The 32-bit version meets the needs of most users. The main limitation is that a maximum of 4Gb RAM can be used.
              This will download the 32-bit usearch binary for you or use a version downloaded for a previous run. You agree to the <a @click="openInDefaultBrowser('https://drive5.com/usearch/license32.html')" class="underline cursor-pointer text-blue-500">terms of the USEARCH 32-bit license</a>.
            </div>
          </div>
        </div>
      </label>
    </div>

    <div>
      <input
          type="radio"
          v-model="usearch"
          value="path"
          id="usearch-select-provide"
          class="peer hidden [&:checked_+_label_svg]:block"
      />

      <label for="usearch-select-provide"
             class="flex cursor-pointer items-center justify-between rounded-lg border border-gray-300 bg-white p-4 text-sm font-medium shadow-sm hover:border-gray-200 peer-checked:border-blue-500 peer-checked:ring-1 peer-checked:ring-blue-500">
        <div class="flex items-center gap-2">
          <div class="relative">
            <div class="text-sm">Use your own binary (64-bit or 32-bit)</div>
            <div class="text-xs text-gray-500">
              Select this to provide your own binary of USEARCH version 11 (Linux binary!). This is useful if you have a 64-bit version of USEARCH or want to
              use your personalized 32-bit version.
              The license for the 64-bit version allows to run only one process at any given time. For binaries shared
              within a group make sure no one else is running USEARCH at the same time.
            </div>
            <br>
            <div class="text-xs text-gray-500">
              If you select this option, please select the binary file here. The file is most likely named usearch11.0.667_i86linux64.
              <br>
              <button
                  class="mt-1 bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-1 px-4 border border-blue-500 hover:border-transparent rounded"
                  @click="selectUsearchFile">Select USEARCH File
              </button>
              <div v-if="usearchPath">Path: {{ usearchPath }}</div>
              <div v-else>Path: not selected</div>
            </div>
          </div>
        </div>
      </label>
    </div>
  </fieldset>
  <!--  <div class="mt-4 font-mono text-red-800 text-xs">-->
  <!--    <p>spikeMode: {{ spikeMode }}</p>-->
  <!--  </div>-->
  <button @click="run()"
          class="mt-3 bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-1 px-4 border border-blue-500 hover:border-transparent rounded">
    Run
  </button>
</template>

<script setup lang="ts">
import {ref} from "vue";
import {useRouter} from "vue-router";

const router = useRouter();

let usearch = ref("download");
let usearchPath = ref("");

async function openInDefaultBrowser(url: string) {
  await indexBridge.openExternal(url);
}

async function selectUsearchFile() {
  await indexBridge.handleFileOpen().then(async (file: string) => {
    console.log("Usearch path: ", file);
    usearch.value = "path";
    usearchPath.value = file;
  }).catch(() => {
    console.log("Could not select usearch file");
  });
}

async function run() {
  // if (usearch.value === "download") {
  //   await indexBridge.publishUsearchBinary("");
  // } else {
  //   await indexBridge.publishUsearchBinary(usearchPath.value);
  // }

  await router.push("/run");
}
</script>

<script lang="ts">
import {defineComponent} from 'vue';

export default defineComponent({
  name: 'SpikeMode',
});
</script>