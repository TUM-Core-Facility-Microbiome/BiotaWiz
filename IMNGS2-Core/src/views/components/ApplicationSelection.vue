<template>
  <div>
    <div>
      <h1 class="text-2xl font-semibold mb-4">Applications</h1>
      <ul class="mt-4 space-y-2">
        <li>
          <router-link to="/application-shell/tic" class="block h-full rounded-lg border-2 border-gray-700 p-4 hover:border-tic">
            <strong class="font-medium text-black">TIC</strong>

            <p class="mt-1 text-xs font-medium text-gray-800">
              Generate clusters from 16S amplicon sequencing data using Taxonomy Informed Clustering.
            </p>
          </router-link>
        </li>
        <!--        <li>-->
        <!--          <router-link to="/application-shell/rhea" class="block h-full rounded-lg border-2 border-gray-700 p-4 hover:border-orange-400">-->
        <!--            <strong class="font-medium text-black">shiny-Rhea</strong>-->

        <!--            <p class="mt-1 text-xs font-medium text-gray-800">-->
        <!--              Tool for analysis of microbial profiles.-->
        <!--            </p>-->
        <!--          </router-link>-->
        <!--        </li>-->
      </ul>
    </div>

  </div>
</template>
<script setup lang="ts">
import {reactive} from "vue";

const state = reactive({
  name: null as string | null,
  version: null as string | null,
});

function getName() {
  indexBridge.getName().then((name: string) => {
    state.name = name;
  });
}
function getVersion() {
  indexBridge.getVersion().then((version: string) => {
    state.version = version;
  });
}

getName();
getVersion();
</script>
