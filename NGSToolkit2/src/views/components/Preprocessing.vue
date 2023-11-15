<template>
  <button class="btn btn-blue" type="button" id="btn" @click="handleClick">Choose a folder</button>
  <p v-if="state.path">Path: <strong class="break-normal sm:break-words md:break-all lg:truncate xl:break-normal ...">{{state.path}}</strong></p>
</template>

<script setup>

import {reactive} from "vue";

const state = reactive({
  path: null,
});

function handleClick() {
  indexBridge.handleFolderOpen().then((path) => {
    console.log("Path returned");
    console.log(path);
    state.path = path;
  }).catch((err) => {
    console.log(err);
    state.path = null;
  });
}
</script>
