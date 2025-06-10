<template>
  <div>
    <div class="text-lg font-bold">Parameters</div>
    <div class="text-sm text-gray-700">
      Set the parameters for the Taxonomy Informed Clustering pipeline.
    </div>
  </div>
  <div class="mt-3 divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white select-none">
    <details class="group p-6" open>
      <summary class="flex cursor-pointer items-center justify-between gap-1.5 text-gray-900">
        <h2 class="text-lg font-medium">Basic Parameters</h2>

        <span class="relative h-5 w-5 shrink-0">
          <ReduceIcon/>
          <ExpandIcon/>
        </span>
      </summary>

      <p class="leading-relaxed">
        <form>
          <div class="pt-6">
            <div class="text-lg font-bold">Preprocessing</div>
            <div class="mt-0">
              <div class="flex items-start space-x-3">
                <div class="relative mb-6">
                  <input
                      id="preprocess-to-individual-zotus"
                      type="checkbox"
                      v-model="preprocessToIndividualZOTUs"
                      class="border rounded-md"
                  >
                </div>
                <label for="preprocess-to-individual-zotus" class="pt-1">
                  <p class="text-sm font-mono">Create ZOTU table for each sample</p>
                  <p class="text-xs text-gray-500">
                    Choosing this option will tirgger full preprocessing for each sample. It produces ZOTUs table for each sample and
                    increases pipeline run time.
                  </p>
                </label>
              </div>
            </div>
          </div>
          <div class="pt-6">
            <div class="text-lg font-bold">Threads</div>
            <div class="text-sm text-gray-700">
              Some pipeline steps might run in parallel to speed up the execution. You can restrict the number of threads
              used by the pipeline, when you have other processes running or when you experience issues with memory usage.
            </div>
            <div class="mt-3">
              <div>
                <label for="threads">
                  <div class="text-sm font-mono">threads</div>
                  <div class="text-xs text-gray-500">Number of threads to be used by the pipeline.</div>
                </label>
                <div class="relative mb-6">
                  <vue-slider
                      v-model="pthreads"
                      :min="1"
                      :max="max_threads"
                      :interval= "1"
                      :marks="true"
                      :adsorb="true"
                      :tooltip-placement="'bottom'"
                      class="m-2"
                  />
                </div>
              </div>
            </div>
          </div>
          <div class="pt-6">
            <div class="text-lg font-bold">Trimming</div>
            <div class="text-sm text-gray-700">
              Remove primer artifacts at the beginning and end of reads.
              Adjust these settings based on the length of the primers.
              <br>
              If all samples are un-paired, only <code>stripleft</code> will be used. You can keep the default value
              for <code>stripright</code>.
            </div>
            <div class="grid grid-cols-1 gap-6 mt-3 sm:grid-cols-2">
              <div>
                <label for="stripleft">
                  <div class="text-sm font-mono">stripleft</div>
                  <div class="text-xs text-gray-500">Number of nucleotides to be cut from left side of your merged
                    sequence. Depends on length of your forward primer.
                  </div>
                </label>
                <input
                    id="stripleft"
                    type="text"
                    v-model="stripleft"
                    placeholder="default: 17"
                    class="block w-full px-4 py-2 mt-2 border rounded-md focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring"
                >
              </div>
              <div>
                <label for="stripright">
                  <div class="text-sm font-mono">stripright</div>
                  <div class="text-xs text-gray-500">Number of nucleotides to be cut from left side of your merged
                    sequence. Depends on length of your reverse primer.
                  </div>
                </label>
                <input
                    id="stripright"
                    type="text"
                    v-model="stripright"
                    placeholder="default: 21"
                    class="block w-full px-4 py-2 mt-2 border rounded-md focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring"
                >
              </div>
            </div>
          </div>
          <div class="pt-6">
            <div class="text-lg font-bold">Abundance limit</div>
            <div class="text-sm text-gray-700">
              Abundance limit for table creation.
            </div>
            <div class="mt-3">
              <div>
                <label for="abund_limit">
                  <div class="text-sm font-mono">abund_limit</div>
                  <div class="text-xs text-gray-500">Only ZOTUs with abundance more than this value in any of samples
                    will be kept. SOTUs count will get updated according to filtered ZOTUs. This means, ZOTUs which is
                    not abundant more than this value in any samples will get removed from ZOTU table (i.e: SOTU table
                    gets updated).
                  </div>
                </label>
                <div class="flex items-center gap-1">
                  <div type="button" class="size-10 leading-10 mt-2 pl-3 text-gray-600">%</div>

                  <input
                      id="abund_limit"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      v-model="abund_limit"
                      placeholder="default: 0.25%"
                      class="block w-full px-4 py-2 mt-2 border rounded-md focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring"
                  >
                </div>

              </div>
            </div>
          </div>
          <div class="pt-6">
            <div class="text-lg font-bold">Sample-wise correction</div>
            <div class="text-sm text-gray-700">
              If set to yes then ZOTUs of one specific sample with abundance below <code>abund_limit</code> argument
              will be rounded to zero. This means richness of each sample will be equal to 'effective richness'.
            </div>
            <div class="mt-3">
              <fieldset class="flex flex-wrap gap-3">
                <legend class="sr-only">Color</legend>

                <div>
                  <input
                      type="radio"
                      v-model="sample_wise_correction"
                      value=true
                      id="sample-wise-correction-yes"
                      class="peer hidden"
                  />

                  <label
                      for="sample-wise-correction-yes"
                      class="flex cursor-pointer items-center justify-center rounded-md border border-gray-100 bg-white px-3 py-2 text-gray-900 hover:border-gray-200 peer-checked:border-blue-500 peer-checked:bg-blue-500 peer-checked:text-white"
                  >
                    <p class="text-sm font-medium">Yes</p>
                  </label>
                </div>

                <div>
                  <input
                      type="radio"
                      v-model="sample_wise_correction"
                      value=false
                      id="sample-wise-correction-no"
                      class="peer hidden"
                      checked
                  />

                  <label
                      for="sample-wise-correction-no"
                      class="flex cursor-pointer items-center justify-center rounded-md border border-gray-100 bg-white px-3 py-2 text-gray-900 hover:border-gray-200 peer-checked:border-blue-500 peer-checked:bg-blue-500 peer-checked:text-white"
                  >
                    <p class="text-sm font-medium">No</p>
                  </label>
                </div>
              </fieldset>
            </div>
          </div>
        </form>
      </p>
    </details>

    <details class="group p-6 [&_summary::-webkit-details-marker]:hidden">
      <summary class="flex cursor-pointer items-center justify-between gap-1.5 text-gray-900">
        <h2 class="text-lg font-medium">Advanced Parameters</h2>

        <span class="relative h-5 w-5 shrink-0">
          <ReduceIcon/>
          <ExpandIcon/>
        </span>
      </summary>

      <p class="leading-relaxed">
        <div role="alert" class="rounded border-s-4 border-orange-500 bg-orange-50 p-4 mt-6">
          <strong class="block font-medium text-orange-800">Expert mode</strong>

          <p class="mt-2 text-sm text-orange-700">
            Default values are recommended for most users.
            Changing these, might result in unexpected results.
          </p>
        </div>

        <form>
          <div class="pt-6">
            <div class="text-lg font-bold">Merging of paired reads</div>
            <div class="text-sm text-gray-700">
              Parameters for merging paired reads.
            </div>
            <div class="mt-3">
              <div>
                <label for="fastq_maxdiffs">
                  <div class="text-sm font-mono">fastq_maxdiffs</div>
                  <div class="text-xs text-gray-500">Maximum number of mismatches when merging pairs of reads in paired
                    sequencing layout.
                  </div>
                </label>
                <input
                    id="fastq_maxdiffs"
                    type="text"
                    v-model="fastq_maxdiffs"
                    placeholder="default: 50"
                    class="block w-full px-4 py-2 mt-2 border rounded-md focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring"
                >
              </div>
            </div>
            <div class="mt-3">
              <div>
                <label for="fastq_pctid">
                  <div class="text-sm font-mono">fastq_pctid</div>
                  <div class="text-xs text-gray-500">Minimum percentage of alignment identity when merging pairs of
                    reads in paired sequencing layout.
                  </div>
                </label>
                <input
                    id="fastq_pctid"
                    type="text"
                    v-model="fastq_pctid"
                    placeholder="default: 50"
                    class="block w-full px-4 py-2 mt-2 border rounded-md focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring"
                >
              </div>
            </div>
            <div class="grid grid-cols-1 gap-6 mt-3 sm:grid-cols-2">
              <div>
                <label for="fastq_minmergelen">
                  <div class="text-sm font-mono">fastq_minmergelen</div>
                  <div class="text-xs text-gray-500">Minimum required length for the merged sequence.</div>
                </label>
                <input
                    id="fastq_minmergelen"
                    type="text"
                    v-model="fastq_minmergelen"
                    placeholder="default: 200"
                    class="block w-full px-4 py-2 mt-2 border rounded-md focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring"
                >
              </div>
              <div>
                <label for="fastq_maxmergelen">
                  <div class="text-sm font-mono">fastq_maxmergelen</div>
                  <div class="text-xs text-gray-500">Maximum required length for the merged sequence.</div>
                </label>
                <input
                    id="fastq_maxmergelen"
                    type="text"
                    v-model="fastq_maxmergelen"
                    placeholder="default: 600"
                    class="block w-full px-4 py-2 mt-2 border rounded-md focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring"
                >
              </div>
            </div>
          </div>
          <div class="pt-6">
            <div class="text-lg font-bold">ZOTU cluster size</div>
            <div class="text-sm text-gray-700">
              Parameters for ZOTU clustering.
            </div>
            <div class="mt-3">
              <div>
                <label for="minsize">
                  <div class="text-sm font-mono">minsize</div>
                  <div class="text-xs text-gray-500">Unique reads with less than this number of raw assigned reads will
                    be discarded in ZOTU creation step. Most of unique reads with low number of assigned reads are
                    noise.
                  </div>
                </label>
                <input
                    id="minsize"
                    type="text"
                    v-model="minsize"
                    placeholder="default: 2"
                    class="block w-full px-4 py-2 mt-2 border rounded-md focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring"
                >
              </div>
            </div>
          </div>
          <div class="pt-6" v-if="analysisMode == 'de-novo'">

            <div class="text-lg font-bold">De-novo clustering ZOTU cluster size</div>
            <div class="text-sm text-gray-700">
              Parameters for ZOTU clustering in de-novo clustering mode.
            </div>
            <div class="mt-3">
              <div>
                <label for="de_novo_minsize">
                  <div class="text-sm font-mono">minsize</div>
                  <div class="text-xs text-gray-500">Any sequence in pool of unique sequences across your samples with less than the set number of duplicates will be discarded for ZOTU creation.
                  </div>
                </label>
                <input
                    id="de_novo_minsize"
                    type="text"
                    v-model="de_novo_minsize"
                    placeholder="default: 8"
                    class="block w-full px-4 py-2 mt-2 border rounded-md focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring"
                >
              </div>
            </div>
          </div>
          <div class="pt-6" v-if="analysisMode == 'TIC'">
            <div class="text-lg font-bold">Complex TIC arguments</div>
            <div class="text-sm text-gray-700">
              Thresholds for taxonomy informed clustering. Watch out to not set the threshold of a lower rank higher
              than the threshold of a higher rank.
            </div>
            <div class="mt-3">
              <div>
                <label for="family_sim">
                  <div class="text-sm font-mono">family_sim</div>
                  <div class="text-xs text-gray-500">Family alignment identity threshold to group unknown ZOTUs into
                    distinct clusters at family level. Sequences with alignment identity more than this value will be
                    taken together as one (unknown) family.
                  </div>
                </label>
                <input
                    id="family_sim"
                    type="text"
                    v-model="family_sim"
                    placeholder="default: 0.95"
                    class="block w-full px-4 py-2 mt-2 border rounded-md focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring"
                >
                <div class="relative mb-6">
                  <input
                      type="range"
                      v-model="family_sim"
                      min="0"
                      max="1"
                      step="0.01"
                      class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      tabindex="-1"
                  >
                  <span class="text-sm text-gray-500 absolute start-0 -bottom-6">Min (0)</span>
                  <span class="text-sm text-gray-500 absolute end-0 -bottom-6">Max (1)</span>
                </div>
              </div>
            </div>
            <div class="mt-3 pt-4">
              <div>
                <label for="genus_sim">
                  <div class="text-sm font-mono">genus_sim</div>
                  <div class="text-xs text-gray-500">Genus alignment identity threshold to group unknown ZOTUs into
                    distinct clusters at genus level. Sequences with alignment identity more than this value will be
                    taken together as one (unknown) genus.
                  </div>
                </label>
                <input
                    id="genus_sim"
                    type="text"
                    v-model="genus_sim"
                    placeholder="default: 0.97"
                    class="block w-full px-4 py-2 mt-2 border rounded-md focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring"
                >
                <div class="relative mb-6">
                  <input
                      type="range"
                      v-model="genus_sim"
                      min="0"
                      max="1"
                      step="0.01"
                      class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      tabindex="-1"
                  >
                  <span class="text-sm text-gray-500 absolute start-0 -bottom-6">Min (0)</span>
                  <span class="text-sm text-gray-500 absolute end-0 -bottom-6">Max (1)</span>
                </div>
              </div>
            </div>
            <div class="mt-3 pt-4">
              <div>
                <label for="species_sim">
                  <div class="text-sm font-mono">species_sim</div>
                  <div class="text-xs text-gray-500">Species alignment identity threshold to group unknown ZOTUs into
                    distinct clusters at species level. Sequences with alignment identity more than this value will be
                    taken together as one (unknown) species.
                  </div>
                </label>
                <input
                    id="species_sim"
                    type="text"
                    v-model="species_sim"
                    placeholder="default: 0.987"
                    class="block w-full px-4 py-2 mt-2 border rounded-md focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring"
                >
                <div class="relative mb-6">
                  <input
                      type="range"
                      v-model="species_sim"
                      min="0"
                      max="1"
                      step="0.01"
                      class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      tabindex="-1"
                  >
                  <span class="text-sm text-gray-500 absolute start-0 -bottom-6">Min (0)</span>
                  <span class="text-sm text-gray-500 absolute end-0 -bottom-6">Max (1)</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </p>
    </details>
  </div>
</template>

<script setup lang="ts">
import {ref, watchEffect} from 'vue';
import {useRouter} from "vue-router";
import VueSlider from 'vue-slider-component'
import 'vue-slider-component/theme/antd.css'
import {Imngs2CoreAnalysisMode} from "../../../../enums";

const router = useRouter();

let analysisMode = ref("TIC");
let pthreads = ref(1);
let max_threads = ref(1);

function getAnalysisMode() {
  indexBridge.getImngs2CoreAnalysisMode().then((mode) => {
    console.log("Analysis mode: ", mode);
    analysisMode.value = mode.valueOf();
  });
}
getAnalysisMode();

function setThreadDefaults() {
  indexBridge.getMachineThreads().then((threads) => {
    console.log("Machine threads: ", threads);
    max_threads.value = threads;
  }).catch(() => {
    console.error("Could not get machine threads");
  });
  indexBridge.getRecommendedThreads().then((threads) => {
    console.log("Recommended threads: ", threads);
    pthreads.value = threads;
  }).catch(() => {
    console.error("Could not get pipeline threads");
  });
}
setThreadDefaults();

let preprocessToIndividualZOTUs = ref(false);

// trigger when preprocessToIndividualZOTUs changes
watchEffect(() => {
  indexBridge.publishImngs2CorePreprocessToIndividualZOTUs(preprocessToIndividualZOTUs.value).then(() => {
    console.log("Published preprocessToIndividualZOTUs");
  }).catch(() => {
    console.error("Could not publish preprocessToIndividualZOTUs");
  });
});

let stripleft = ref(17);
let stripright = ref(21);
let abund_limit = ref(0.25);
let sample_wise_correction = ref(false);

let fastq_maxdiffs = ref(50);
let fastq_pctid = ref(50);
let fastq_minmergelen = ref(200);
let fastq_maxmergelen = ref(600);
let minsize = ref(2);
let de_novo_minsize = ref(8);
let family_sim = ref(0.95);
let genus_sim = ref(0.97);
let species_sim = ref(0.987);

const emit = defineEmits(['update:isValid']);
watchEffect(() => {
  emit('update:isValid', true);
});

async function generateImngs2CorePipelineArgumentsObj(): Promise<IImngs2CoreArguments> {
  return new Promise<IImngs2CoreArguments>((resolve, reject) => {
    const trimBothSidesArgs: ITrimBothSidesArgs = {
      stripleft: Number(stripleft.value),  // stripleft applies to both TrimBothSidesArgs and TrimOneSideArgs
      stripright: Number(stripright.value),
    };

    const trimOneSideArgs: ITrimOneSideArgs = {
      stripleft: Number(stripleft.value),  // stripleft applies to both TrimBothSidesArgs and TrimOneSideArgs
    };

    const createTableTICArgs: IClusterZOTUsArgs = {
      abund_limit: Number(abund_limit.value)*0.01, // in percentages
      sample_wise_correction: Boolean(sample_wise_correction.value),
    };

    const mergePairsArgs: IMergePairsArgs = {
      fastq_maxdiffs: Number(fastq_maxdiffs.value),
      fastq_pctid: Number(fastq_pctid.value),
      fastq_minmergelen: Number(fastq_minmergelen.value),
      fastq_maxmergelen: Number(fastq_maxmergelen.value),
    };

    const clusterZOTUsArgs: IIndividualSampleClusterZOTUsArgs = {
      minsize: Number(minsize.value),
    };

    // get default arguments and patch with user input
    indexBridge.getImngs2coreDefaultParameters().then((defaultArgs) => {
      const args = defaultArgs;
      args.TrimBothSidesArgs = trimBothSidesArgs;
      args.TrimOneSideArgs = trimOneSideArgs;
      args.CreateTableTICArgs = createTableTICArgs;
      args.MergePairsArgs = mergePairsArgs;
      args.ClusterZOTUsArgs = clusterZOTUsArgs;

      if (analysisMode.value == "TIC") {
        // set arguments specific for TIC mode
        args.ComplexTICArgs = {
          family_sim: Number(family_sim.value),
          genus_sim: Number(genus_sim.value),
          species_sim: Number(species_sim.value),
        };
      } else if (analysisMode.value == "de-novo") {
        // set arguments specific for de-novo clustering mode
        args.DeNovoClusterZOTUsArgs = {minsize: Number(minsize.value)};
      }

      resolve(args);
    }).catch(() => {
      console.error("Could not get default IMNGS2-Core parameters");
      reject();
    });
  });
}

async function apply() {
  return new Promise<void>((resolve, reject) => {
    indexBridge.publishImngs2CoreThreads(pthreads.value).then(async () => {
      console.log("Published IMNGS2-Core threads");
      const pipelineArgs = await generateImngs2CorePipelineArgumentsObj();
      console.log("Pipeline arguments: ", pipelineArgs);

      // ensure mapping file is in the correct format
      indexBridge.convertMapping().then(() => {
        console.log("Mapping file converted");

        // publish pipeline arguments
        indexBridge.publishImngs2CoreParameters(pipelineArgs).then(() => {
          console.log("Published IMNGS2-Core pipeline arguments");
          resolve();
        }).catch(() => {
          console.error("Could not publish IMNGS2-Core pipeline arguments");
          reject();
        });

      }).catch(() => {
        console.error("Could not convert mapping file");
        reject();
      });

    }).catch(() => {
      console.error("Could not publish IMNGS2-Core threads");
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
import ReduceIcon from "../../default/icons/ReduceIcon.vue";
import ExpandIcon from "../../default/icons/ExpandIcon.vue";

export default defineComponent({
  name: 'Arguments',
  components: {ExpandIcon, ReduceIcon},
});
</script>