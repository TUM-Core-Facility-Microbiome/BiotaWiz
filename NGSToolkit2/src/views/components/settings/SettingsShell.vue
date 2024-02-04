<template>
  <div class="container left-16 relative">
    <div class="flex h-screen flex-1 flex-col justify-between border-e bg-white w-48">
      <div class="px-2 py-6">
        <ul class="mt-14 space-y-1">
          <li>
            <router-link class="block rounded-lg px-4 py-2 text-sm font-medium text-gray-700" active-class="bg-gray-100"
                         to="/settings/general"
            >
              General
            </router-link>
          </li>
          <li>
            <router-link class="block rounded-lg px-4 py-2 text-sm font-medium text-gray-700" active-class="bg-gray-100"
                         to="/settings/backend"
            >
              Backend Information
            </router-link>
          </li>
          <li>
            <router-link class="block rounded-lg px-4 py-2 text-sm font-medium text-gray-700" active-class="bg-gray-100"
                         to="/settings/driver"
            >
              Driver
            </router-link>
          </li>
        </ul>
      </div>
    </div>
  </div>
  <router-view class="container relative m-3"></router-view>
</template>
<script setup lang="ts">
</script>
