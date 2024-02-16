<template>
  <div class="container left-16 relative">
    <div class="flex h-screen flex-1 flex-col justify-between border-e bg-white w-48">
      <div class="px-2 py-6">
        <ul class="mt-14 space-y-1">
          <li>
            <router-link class="block rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700" active-class="bg-gray-100"
                         to="/settings/general"
            >
              General
            </router-link>
          </li>
          <li>
            <router-link class="block rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700" active-class="bg-gray-100"
                         to="/settings/backend"
            >
              Backend
            </router-link>
          </li>
          <li>
            <details class="group [&_summary::-webkit-details-marker]:hidden">
              <summary class="flex cursor-pointer items-center justify-between rounded-lg px-4 py-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                <span class="text-sm font-medium">Environments</span>

                <span class="shrink-0 transition duration-300 group-open:-rotate-180">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                  <path
                      fill-rule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clip-rule="evenodd"
                  />
                </svg>
              </span>
              </summary>

              <ul class="mt-2 space-y-1 px-4">
                <li>
                  <router-link class="block rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700" active-class="bg-gray-100"
                               to="/settings/environment/tic-pipeline"
                  >
                    TIC Pipeline
                  </router-link>
                </li>

                <li>
                  <router-link class="block rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700" active-class="bg-gray-100"
                               to="/settings/environment/shiny-rhea"
                  >
                    Shiny Rhea
                  </router-link>
                </li>
              </ul>
            </details>
          </li>
        </ul>
      </div>
    </div>
  </div>
  <router-view class="container relative m-3 left-16"></router-view>
</template>
<script setup lang="ts">
</script>
