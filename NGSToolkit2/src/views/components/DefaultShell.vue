<template>
  <div>
    <div class="flex-grow">
      <div class="container left-16 m-3 relative mb-16">
        <router-view></router-view>
      </div>
    </div>
    <footer class="fixed bottom-0 bg-gray-800 py-4 w-full z-40 border-t">
      <div class="pl-16">
        <div class="flex justify-between">
          <div>
            <p class="text-white">TIC</p>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>
