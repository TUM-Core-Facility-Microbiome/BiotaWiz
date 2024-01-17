<template>
  <div class="divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white select-none">
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
            <div class="text-lg font-bold">Trimming</div>
            <div class="text-sm text-gray-700">
              Remove primer artifacts at the beginning and end of reads.
              Adjust these settings based on the length of the primers.
            </div>
            <div class="grid grid-cols-1 gap-6 mt-3 sm:grid-cols-2">
              <div>
                <label for="stripleft">
                  <div class="text-sm font-mono">stripleft</div>
                  <div class="text-xs text-gray-500">length of 5' primer</div>
                </label>
                <input
                    id="stripleft"
                    type="text"
                    v-model="stripleft"
                    placeholder="default: 15"
                    class="block w-full px-4 py-2 mt-2 border rounded-md focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring"
                >
              </div>
              <div>
                <label for="stripright">
                  <div class="text-sm font-mono">stripright</div>
                  <div class="text-xs text-gray-500">length of 3' primer</div>
                </label>
                <input
                    id="stripright"
                    type="text"
                    v-model="stripright"
                    placeholder="default: 15"
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
                  <div class="text-xs text-gray-500">abundance limit</div>
                </label>
                <input
                    id="abund_limit"
                    type="text"
                    v-model="abund_limit"
                    placeholder="default: 0.00"
                    class="block w-full px-4 py-2 mt-2 border rounded-md focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring"
                >
                <div class="relative mb-6">
                  <input
                      type="range"
                      v-model="abund_limit"
                      min="0"
                      max="0.5"
                      step="0.01"
                      class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      tabindex="-1"
                  >
                  <span class="text-sm text-gray-500 absolute start-0 -bottom-6">No filtering (0)</span>
                  <span class="text-sm text-gray-500 absolute end-0 -bottom-6">Max (0.5)</span>
                </div>
              </div>
            </div>
          </div>
          <div class="pt-6">
            <div class="text-lg font-bold">Sample-wise correction</div>
            <div class="text-sm text-gray-700">
              Apply sample-wise correction.
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
            Changing these may result in unexpected results.
          </p>
        </div>

        <form>
          <div class="pt-6">
            <div class="text-lg font-bold">Merging of paired reads</div>
            <div class="text-sm text-gray-700">
              Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore
              et dolore magna aliquyam erat, sed diam voluptua.
            </div>
            <div class="mt-3">
              <div>
                <label for="fastq_maxdiffs">
                  <div class="text-sm font-mono">fastq_maxdiffs</div>
                  <div class="text-xs text-gray-500">lorem ipsum dolor sit amet</div>
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
                  <div class="text-xs text-gray-500">lorem ipsum dolor sit amet</div>
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
                  <div class="text-xs text-gray-500">lorem ipsum dolor sit amet</div>
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
                  <div class="text-xs text-gray-500">lorem ipsum dolor sit amet</div>
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
            <div class="text-lg font-bold">zOTU cluster size</div>
            <div class="text-sm text-gray-700">
              Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore
              et dolore magna aliquyam erat, sed diam voluptua.
            </div>
            <div class="mt-3">
              <div>
                <label for="minsize">
                  <div class="text-sm font-mono">minsize</div>
                  <div class="text-xs text-gray-500">lorem ipsum dolor sit amet</div>
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
          <div class="pt-6">
            <div class="text-lg font-bold">Complex TIC arguments</div>
            <div class="text-sm text-gray-700">
              Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore
              et dolore magna aliquyam erat, sed diam voluptua.
            </div>
            <div class="mt-3">
              <div>
                <label for="family_sim">
                  <div class="text-sm font-mono">family_sim</div>
                  <div class="text-xs text-gray-500">lorem ipsum dolor sit amet</div>
                </label>
                <input
                    id="family_sim"
                    type="text"
                    v-model="family_sim"
                    placeholder="default: 0.90"
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
                  <div class="text-xs text-gray-500">lorem ipsum dolor sit amet</div>
                </label>
                <input
                    id="genus_sim"
                    type="text"
                    v-model="genus_sim"
                    placeholder="default: 0.95"
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
                  <div class="text-xs text-gray-500">lorem ipsum dolor sit amet</div>
                </label>
                <input
                    id="species_sim"
                    type="text"
                    v-model="species_sim"
                    placeholder="default: 0.97"
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

  <div class="mt-4 font-mono text-red-800 text-xs">
    <p>stripleft: {{ stripleft }}</p>
    <p>stripright: {{ stripright }}</p>
    <p>abund_limit: {{ abund_limit }}</p>
    <p>sample_wise_correction: {{ sample_wise_correction }}</p>
    <br>
    <p>fastq_maxdiffs: {{ fastq_maxdiffs }}</p>
    <p>fastq_pctid: {{ fastq_pctid }}</p>
    <p>fastq_minmergelen: {{ fastq_minmergelen }}</p>
    <p>fastq_maxmergelen: {{ fastq_maxmergelen }}</p>
    <p>minsize: {{ minsize }}</p>
    <p>family_sim: {{ family_sim }}</p>
    <p>genus_sim: {{ genus_sim }}</p>
    <p>species_sim: {{ species_sim }}</p>
    <br>
  </div>
  <div>
    <button class="btn" @click="generateYaml()">Generate YAML</button>
  </div>

</template>

<script setup lang="ts">
import {ref} from 'vue';
import {stringify} from "yaml";

let stripleft = ref(15);
let stripright = ref(15);
let abund_limit = ref(0.00);
let sample_wise_correction = ref(false);

let fastq_maxdiffs = ref(50);
let fastq_pctid = ref(50);
let fastq_minmergelen = ref(200);
let fastq_maxmergelen = ref(600);
let minsize = ref(2);
let family_sim = ref(0.90);
let genus_sim = ref(0.95);
let species_sim = ref(0.97);

function generateTicPipelineArgumentsObj(): ITicPipelineArguments {
  const DEFAULT_TIC_PIPELINE_ARGUMENTS: ITicPipelineArguments = {
    MergePairsArgs: {
      fastq_maxdiffs: 50,
      fastq_pctid: 50,
      fastq_minmergelen: 200,
      fastq_maxmergelen: 600
    },
    TrimBothSidesArgs: {
      stripleft: 15,
      stripright: 15
    },
    TrimOneSideArgs: {
      stripleft: 15
    },
    FilterBothSidesArgs: {
      fastq_maxee_rate: 0.002
    },
    FilterOneSideArgs: {
      fastq_maxee_rate: 0.002,
      fastq_truncqual: 10
    },
    DereplicationArgs: {
      sizein: true,
      sizeout: true
    },
    ClusterZOTUsArgs: {
      minsize: 2
    },
    Filter16SArgs: {
      e: 0.1,
      num_alignments: 1
    },
    BuildZOTUTableArgs: {
      id: 0.99
    },
    FilterZOTUAbundanceArgs: {
      abundance_cutoff: 0
    },
    AddTaxArgs: {
      turn: "all"
    },
    TrimSidesArgs: {
      stripleft: 5,
      stripright: 5
    },
    ComplexTICArgs: {
      family_sim: 0.9,
      genus_sim: 0.95,
      species_sim: 0.97
    },
    CreateTableTICArgs: {
      abund_limit: 0,
      sample_wise_correction: false
    }
  }

  const trimBothSidesArgs: ITrimBothSidesArgs = {
    stripleft: Number(stripleft.value),
    stripright: Number(stripright.value),
  };

  const createTableTICArgs: ICreateTableTICArgs = {
    abund_limit: Number(abund_limit.value),
    sample_wise_correction: Boolean(sample_wise_correction.value),
  };

  const mergePairsArgs: IMergePairsArgs = {
    fastq_maxdiffs: Number(fastq_maxdiffs.value),
    fastq_pctid: Number(fastq_pctid.value),
    fastq_minmergelen: Number(fastq_minmergelen.value),
    fastq_maxmergelen: Number(fastq_maxmergelen.value),
  };

  const clusterZOTUsArgs: IClusterZOTUsArgs = {
    minsize: Number(minsize.value),
  };

  const complexTICArgs: IComplexTICArgs = {
    family_sim: Number(family_sim.value),
    genus_sim: Number(genus_sim.value),
    species_sim: Number(species_sim.value),
  };

  // patch args
  const args = DEFAULT_TIC_PIPELINE_ARGUMENTS;
  args.TrimBothSidesArgs = trimBothSidesArgs;
  // TODO: TrimOneSideArgs. Is this only for non-paired reads?
  args.CreateTableTICArgs = createTableTICArgs;
  args.MergePairsArgs = mergePairsArgs;
  args.ClusterZOTUsArgs = clusterZOTUsArgs;
  args.ComplexTICArgs = complexTICArgs;

  return args;
}

function generateYaml() {
  const args = generateTicPipelineArgumentsObj();

  console.log(args);
  console.log(stringify(args));
}
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