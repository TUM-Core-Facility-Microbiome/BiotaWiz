<template>
  <div class="fixed top-0 flex z-50">
    <div class="flex h-screen w-16 flex-col justify-between border-e bg-white">
      <div>
        <div class="inline-flex h-16 w-16 items-center justify-center">
          <img
              class="grid h-10 w-10 place-content-center rounded-lg bg-gray-100 text-xs text-gray-600"
              src="assets/icons/icon.png" alt="Logo"
          />
        </div>

        <div class="border-t border-gray-100">
          <div class="px-2">
            <ul class="space-y-1 pt-4">
              <li>
                <router-link class="t group relative flex justify-center rounded px-2 py-1.5 hover:bg-gray-100"
                             active-class="bg-blue-50 text-blue-700"
                             to="/tic">
                  <code class="text-xs font-bold">TIC</code>
                  <span
                      class="invisible absolute start-full top-1/2 ms-4 -translate-y-1/2 rounded bg-gray-900 px-2 py-1.5 text-xs font-medium text-white group-hover:visible">
              Taxonomy Informed Clustering
            </span>
                </router-link>
              </li>

              <li>
                <router-link class="t group relative flex justify-center rounded px-2 py-1.5 hover:bg-gray-100"
                             active-class="bg-blue-50 text-blue-700"
                             to="/rhea">
                  <code class="text-xs font-bold">Rhea</code>
                  <span
                      class="invisible absolute start-full top-1/2 ms-4 -translate-y-1/2 rounded bg-gray-900 px-2 py-1.5 text-xs font-medium text-white group-hover:visible">
              Microbial Profiles Analysis
            </span>
                </router-link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="sticky inset-x-0 bottom-0 border-t border-gray-100 bg-white p-2">
        <div class="py-1">
          <router-link class="t group relative flex justify-center rounded px-2 py-1.5 hover:bg-gray-100"
                       active-class="bg-blue-50 text-blue-700"
                       to="/settings">
            <SettingsIcon></SettingsIcon>
            <span
                class="invisible absolute start-full top-1/2 ms-4 -translate-y-1/2 rounded bg-gray-900 px-2 py-1.5 text-xs font-medium text-white group-hover:visible">
              Settings
            </span>
          </router-link>
        </div>
      </div>
    </div>

  </div>
</template>
<script setup lang="ts">
import Cog8Tooth from "../icons/Cog8Tooth.vue";
import SettingsIcon from "../icons/SettingsIcon.vue";
</script>