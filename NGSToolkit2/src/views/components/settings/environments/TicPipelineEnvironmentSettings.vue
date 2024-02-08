<template>
  <div class="container">
    <div class="flex-1 lg:max-w-2xl">
      <div class="space-y-6">
        <div>
          <h3 class="text-lg font-medium">Image for the TIC pipeline</h3>
          <p class="text-sm text-muted-foreground">The image holds the software that is used to run the TIC pipeline and a copy of the TIC pipeline itself.</p>
        </div>
        <div class="space-y-8">
          <div class="space-y-2">
            <label class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                   for="ImageTag">Update strategy</label>
            <select
                name="ImageTag"
                id="ImageTag"
                class="mt-1.5 w-full rounded-lg border-gray-300 text-gray-700 sm:text-sm"
                v-model="selectedTag"
            >
              <option :value="null">auto-update to latest version every run</option>
              <option v-for="option in compatibleTagStrings" :value="option" :key="option">always use version {{ option }}</option>
            </select>
            <p id="ImageTag" class="text-xs text-muted-foreground">
              Changes in the image can affect the results of the pipeline. You can specify a version of the image to use
              to ensure reproducibility across runs.
            </p>
          </div>
          <div class="space-y-2">
            <div class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                   for="ImageTag">Manage associated images</div>
            <div>
              <table class="min-w-full bg-white shadow-md rounded-lg">
                <thead>
                <tr class="border-b">
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tag</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
                </thead>
                <tbody>
                <tr class="hover:bg-gray-100 border-b" v-for="image in associatedImages" :key="image">
                  <td class="px-6 py-4 whitespace-no-wrap text-sm text-gray-900 font-mono">{{ image.name }}</td>
                  <td class="px-6 py-4 whitespace-no-wrap text-sm text-gray-900">{{ image.tag }}</td>
                  <td class="px-6 py-4">
                    <div class="relative">
                      <div class="inline-flex items-center overflow-hidden rounded-md border bg-white cursor-pointer">
                        <a
                            @click="deleteImage(image.name, image.tag)"
                            class="px-4 py-2 text-sm/none text-red-700 font-bold hover:bg-red-700 hover:text-white"
                        >
                          Delete
                        </a>
                      </div>
                    </div>
                  </td>
                </tr>
                </tbody>
              </table>
            </div>
            <p id="ImageTag" class="text-xs text-muted-foreground">
              You can manage images for the TIC pipeline here. Only images using the current backend are shown.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, watch} from 'vue'
import {Environment} from "../../../../enums";

const compatibleTagStrings = ref([]);
const selectedTag = ref(null);
const associatedImages = ref([]);

const environment = Environment.TIC;

function loadFixedReleaseTag() {
  indexBridge.getFixedImageTagString(environment).then((tag: string) => {
    console.log('Got fixed tag', tag);
    // might be null if not fixed
    selectedTag.value = tag;
  });
}

function loadReleaseTags() {
  loadFixedReleaseTag();
  indexBridge.getCompatibleReleaseTagStrings(environment).then((tags: string[]) => {
    // reverse to get the latest release first
    tags.reverse();
    compatibleTagStrings.value = tags;
  });
}

loadReleaseTags();

// Watch for changes to selectedTag
watch(selectedTag, (newValue, oldValue) => {
  console.log('Selected value changed from', oldValue, 'to', newValue);
  // make sure it is a string or null
  if (typeof newValue !== 'string' && newValue !== null) {
    console.error('Invalid value for selectedTag', newValue);
    return;
  }
  let submitTag;
  if (newValue !== null) {
    submitTag = newValue.toString();
  } else {
    submitTag = null;
  }
  // inform the backend of the updated choice
  indexBridge.setFixedImageTagString(environment, submitTag).then(() => {
    loadReleaseTags();
  });
});


function loadAssociatedImages() {
  indexBridge.getAssociatedImages(environment).then((images: IImage[]) => {
    associatedImages.value = images;
  });
}

loadAssociatedImages();

function deleteImage(name: string, tag: string) {
  indexBridge.deleteImage(name, tag).then(() => {
    loadAssociatedImages();
  });
}
</script>
