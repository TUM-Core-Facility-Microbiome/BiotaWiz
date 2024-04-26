<template>
  <div>
    <div class="text-lg font-bold">Check mapping</div>
    <div class="text-sm text-gray-700">
      Please save the mapping file and click the button below to continue.
    </div>
  </div>

  <button @click="openMappingFile()"
          class="mt-3 bg-transparent hover:bg-blue-500 text-gray-700 font-semibold hover:text-white py-1 px-4 border border-gray-500 hover:border-transparent rounded">
    Reopen mapping file
  </button>
  <br>

  <button @click="checkMappingFile()"
          class="mt-3 bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-1 px-4 border border-blue-500 hover:border-transparent rounded">
    Check mapping file and continue
  </button>
</template>

<script setup lang="ts">
import {ref} from "vue";
import {useRouter} from "vue-router";

const router = useRouter();

let spikeMode = ref("spiked");

function openMappingFile() {
  indexBridge.openMappingFile().catch(() => {
    alert("Could not open mapping file");
  });
}

async function checkMappingFile() {
  await indexBridge.checkMappingFile().then(async () => {
    await router.push("params");
  }).catch((e) => {
    let errorMessage = e.message.replace("Error invoking remote method 'checkMapping': ", '');
    alert(errorMessage);
  });
}
</script>

<script lang="ts">
import {defineComponent} from 'vue';

export default defineComponent({
  name: 'SpikeMode',
});
</script>