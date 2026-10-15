<template>
  <div>
    <div class="text-lg font-bold">Pipeline parameters</div>
    <div class="text-sm text-gray-700">
      Set the parameters for the TACTIC pipeline.
    </div>
  </div>
  <div class="mt-3 divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white select-none">
    <details class="group p-6" open>
      <summary class="flex cursor-pointer items-center justify-between gap-1.5 text-gray-900">
        <h2 class="text-lg font-medium">Basic settings</h2>

        <span class="relative h-5 w-5 shrink-0">
          <ReduceIcon/>
          <ExpandIcon/>
        </span>
      </summary>

      <p class="leading-relaxed">
        <form>
          <div class="pt-6">
            <div class="text-lg font-bold">Threads</div>
            <div class="text-sm text-gray-700">
              Some pipeline steps might run in parallel to speed up the execution. You can restrict the number of threads
              used by the pipeline, when you have other processes running or when you experience issues with memory usage.
            </div>
            <div class="mt-3">
              <div>
                <label for="threads">
                  <div class="text-sm font-medium">Number of CPU threads</div>
                  <div class="text-xs font-mono text-gray-400">threads</div>
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
            <div class="text-lg font-bold">Primer trimming</div>
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
                  <div class="text-sm font-medium">Bases to trim from the start of merged reads</div>
                  <div class="text-xs font-mono text-gray-400">stripleft</div>
                  <div class="text-xs text-gray-500">Number of nucleotides to cut from the left side of your merged sequence. Depends on the length of your forward primer.</div>
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
                  <div class="text-sm font-medium">Bases to trim from the end of merged reads</div>
                  <div class="text-xs font-mono text-gray-400">stripright</div>
                  <div class="text-xs text-gray-500">Number of nucleotides to cut from the right side of your merged sequence. Depends on the length of your reverse primer.</div>
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
        </form>
      </p>
    </details>

    <details class="group p-6 [&_summary::-webkit-details-marker]:hidden">
      <summary class="flex cursor-pointer items-center justify-between gap-1.5 text-gray-900">
        <h2 class="text-lg font-medium">Advanced settings</h2>

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
            <div class="text-lg font-bold">Preprocessing</div>
            <div class="text-sm text-gray-700">
              Options for how reads are prepared before analysis.
            </div>
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
                  <p class="text-sm font-medium">Create a zOTU table for each sample</p>
                  <p class="text-xs text-gray-500">
                    Choosing this option will trigger full preprocessing for each sample. It produces a zOTU table for each sample and
                    increases pipeline run time. When selected, the <em>zOTU picking per sample</em> settings appear
                    below.
                  </p>
                </label>
              </div>
              <div class="flex items-start space-x-3 mt-2">
                <div class="relative mb-6">
                  <input
                      id="skip-non-bacterial-filter"
                      type="checkbox"
                      v-model="skipNonBacterialFilter"
                      class="border rounded-md"
                  >
                </div>
                <label for="skip-non-bacterial-filter" class="pt-1">
                  <p class="text-sm font-medium">Keep sequences that are not bacterial or archaeal</p>
                  <p class="text-xs text-gray-500">
                    If set, the filtering step to filter non-bacterial 16S
                    sequences will be skipped. It speeds up the pipeline
                    and makes the pipeline capable of handling non-16S
                    sequences.
                  </p>
                </label>
              </div>
            </div>
          </div>
          <div class="pt-6">
            <div class="text-lg font-bold">Merging paired-end reads</div>
            <div class="text-sm text-gray-700">
              Settings for merging the forward and reverse reads of each pair into one sequence.
            </div>
            <div class="mt-3">
              <div>
                <label for="fastq_maxdiffs">
                  <div class="text-sm font-medium">Maximum mismatches in the overlap</div>
                  <div class="text-xs font-mono text-gray-400">fastq_maxdiffs</div>
                  <div class="text-xs text-gray-500">Maximum number of mismatches when merging pairs of reads in paired sequencing layout.</div>
                </label>
                <input
                    id="fastq_maxdiffs"
                    type="text"
                    v-model="mergePairsArgs_fastq_maxdiffs"
                    placeholder="default: 50"
                    class="block w-full px-4 py-2 mt-2 border rounded-md focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring"
                >
              </div>
            </div>
            <div class="mt-3">
              <div>
                <label for="fastq_pctid">
                  <div class="text-sm font-medium">Minimum overlap identity (%)</div>
                  <div class="text-xs font-mono text-gray-400">fastq_pctid</div>
                  <div class="text-xs text-gray-500">Minimum percentage of alignment identity when merging pairs of reads in paired sequencing layout.</div>
                </label>
                <input
                    id="fastq_pctid"
                    type="text"
                    v-model="mergePairsArgs_fastq_pctid"
                    placeholder="default: 50"
                    class="block w-full px-4 py-2 mt-2 border rounded-md focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring"
                >
              </div>
            </div>
            <div class="grid grid-cols-1 gap-6 mt-3 sm:grid-cols-2">
              <div>
                <label for="fastq_minmergelen">
                  <div class="text-sm font-medium">Minimum merged read length</div>
                  <div class="text-xs font-mono text-gray-400">fastq_minmergelen</div>
                  <div class="text-xs text-gray-500">Minimum required length for the merged sequence.</div>
                </label>
                <input
                    id="fastq_minmergelen"
                    type="text"
                    v-model="mergePairsArgs_fastq_minmergelen"
                    placeholder="default: 200"
                    class="block w-full px-4 py-2 mt-2 border rounded-md focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring"
                >
              </div>
              <div>
                <label for="fastq_maxmergelen">
                  <div class="text-sm font-medium">Maximum merged read length</div>
                  <div class="text-xs font-mono text-gray-400">fastq_maxmergelen</div>
                  <div class="text-xs text-gray-500">Maximum allowed length for the merged sequence.</div>
                </label>
                <input
                    id="fastq_maxmergelen"
                    type="text"
                    v-model="mergePairsArgs_fastq_maxmergelen"
                    placeholder="default: 600"
                    class="block w-full px-4 py-2 mt-2 border rounded-md focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring"
                >
              </div>
            </div>
          </div>
          <div class="pt-6">
            <div class="text-lg font-bold">Quality filtering: paired-end reads</div>
            <div class="text-sm text-gray-700">
              Filters merged paired-end reads by sequencing quality.
            </div>
            <div class="mt-3">
              <div>
                <label for="filterboth_fastq_maxee_rate">
                  <div class="text-sm font-medium">Maximum expected errors per base</div>
                  <div class="text-xs font-mono text-gray-400">fastq_maxee_rate</div>
                  <div class="text-xs text-gray-500">Discard reads with > E expected errors per base. Calculated after any truncation options have been applied. For example, with the fastq_maxee_rate option set to 0.01, then a read of length 100 will be discarded if the expected errors is >1, and a read of length 1,000 will be discarded if the expected errors is >10.</div>
                </label>
                <input
                    id="filterboth_fastq_maxee_rate"
                    type="text"
                    v-model="filterBothSidesArgs_fastq_maxee_rate"
                    placeholder="default: 0.002"
                    class="block w-full px-4 py-2 mt-2 border rounded-md focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring"
                >
              </div>
            </div>
            <div class="mt-3">
              <div>
                <label for="filterboth_fastq_truncqual">
                  <div class="text-sm font-medium">Truncate reads at quality score</div>
                  <div class="text-xs font-mono text-gray-400">fastq_truncqual</div>
                  <div class="text-xs text-gray-500">Truncate the read at the first position having quality score <= N, so that all remaining Q scores are >N.</div>
                </label>
                <input
                    id="filterboth_fastq_truncqual"
                    type="text"
                    v-model="filterBothSidesArgs_fastq_truncqual"
                    placeholder="default: 10"
                    class="block w-full px-4 py-2 mt-2 border rounded-md focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring"
                >
              </div>
            </div>
          </div>
          <div class="pt-6">
            <div class="text-lg font-bold">Quality filtering: single-end reads</div>
            <div class="text-sm text-gray-700">
              Filters single-end reads by sequencing quality.
            </div>
            <div class="mt-3">
              <div>
                <label for="filterone_fastq_maxee_rate">
                  <div class="text-sm font-medium">Maximum expected errors per base</div>
                  <div class="text-xs font-mono text-gray-400">fastq_maxee_rate</div>
                  <div class="text-xs text-gray-500">Discard reads with > E expected errors per base. Calculated after any truncation options have been applied. For example, with the fastq_maxee_rate option set to 0.01, then a read of length 100 will be discarded if the expected errors is >1, and a read of length 1,000 will be discarded if the expected errors is >10.</div>
                </label>
                <input
                    id="filterone_fastq_maxee_rate"
                    type="text"
                    v-model="filterOneSideArgs_fastq_maxee_rate"
                    placeholder="default: 0.002"
                    class="block w-full px-4 py-2 mt-2 border rounded-md focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring"
                >
              </div>
            </div>
            <div class="mt-3">
              <div>
                <label for="filterone_fastq_truncqual">
                  <div class="text-sm font-medium">Truncate reads at quality score</div>
                  <div class="text-xs font-mono text-gray-400">fastq_truncqual</div>
                  <div class="text-xs text-gray-500">Truncate the read at the first position having quality score <= N, so that all remaining Q scores are >N.</div>
                </label>
                <input
                    id="filterone_fastq_truncqual"
                    type="text"
                    v-model="filterOneSideArgs_fastq_truncqual"
                    placeholder="default: 10"
                    class="block w-full px-4 py-2 mt-2 border rounded-md focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring"
                >
              </div>
            </div>
          </div>
          <div class="pt-6" v-if="preprocessToIndividualZOTUs">
            <div class="text-lg font-bold">zOTU picking per sample</div>
            <div class="text-sm text-gray-700">
              This runs UNOISE3 on the reads of each sample individually. It slows down the process considerably and
              is not recommended unless you specifically need it.
              If you do not want it, uncheck <em>Create a zOTU table for each sample</em> at the top of the advanced
              settings, and this section disappears.
            </div>
            <div class="mt-3">
              <div>
                <label for="minsize">
                  <div class="text-sm font-medium">Minimum number of reads per zOTU</div>
                  <div class="text-xs font-mono text-gray-400">minsize</div>
                  <div class="text-xs text-gray-500">Filters out amplicons with fewer reads than this value. Lower values increase sensitivity but may add noise.</div>
                </label>
                <input
                    id="minsize"
                    type="text"
                    v-model="individualSampleClusterZOTUsArgs_minsize"
                    placeholder="default: 2"
                    class="block w-full px-4 py-2 mt-2 border rounded-md focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring"
                >
              </div>
            </div>
          </div>
          <div class="pt-6">
            <div class="text-lg font-bold">zOTU picking (all samples together)</div>
            <div class="text-sm text-gray-700">
              Settings for picking zOTUs across all samples.
            </div>
            <div class="mt-3">
              <div>
                <label for="clusterZOTUsArgs_minsize">
                  <div class="text-sm font-medium">Minimum number of reads per zOTU</div>
                  <div class="text-xs font-mono text-gray-400">minsize</div>
                  <div class="text-xs text-gray-500">Filters out amplicons with fewer reads than this value. Lower values increase sensitivity but may add noise.</div>
                </label>
                <input
                    id="clusterZOTUsArgs_minsize"
                    type="text"
                    v-model="clusterZOTUsArgs_minsize"
                    placeholder="default: 2"
                    class="block w-full px-4 py-2 mt-2 border rounded-md focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring"
                >
              </div>
            </div>
            <div class="mt-3">
              <div>
                <label for="clusterZOTUsArgs_abund_limit">
                  <div class="text-sm font-medium">Minimum relative abundance</div>
                  <div class="text-xs font-mono text-gray-400">abund_limit</div>
                  <div class="text-xs text-gray-500">Minimum relative abundance of a zOTU across all samples for the zOTU to be kept.</div>
                </label>
                <input
                    id="clusterZOTUsArgs_abund_limit"
                    type="text"
                    v-model="clusterZOTUsArgs_abund_limit"
                    placeholder="default: 0.0000"
                    class="block w-full px-4 py-2 mt-2 border rounded-md focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring"
                >
              </div>
            </div>
            <div class="mt-3">
              <label for="clusterZOTUsArgs_sample-wise-correction">
                <div class="text-sm font-medium">Sample-wise correction</div>
                <div class="text-xs font-mono text-gray-400">sample_wise_correction</div>
                <div class="text-xs text-gray-500">Relative abundances below the abundance limit (above) are rounded to zero.</div>
              </label>
              <fieldset class="flex flex-wrap gap-3">
                <div>
                  <input
                      type="radio"
                      v-model="clusterZOTUsArgs_sample_wise_correction"
                      :value="true"
                      id="clusterZOTUsArgs_sample-wise-correction-yes"
                      class="peer hidden"
                  />

                  <label
                      for="clusterZOTUsArgs_sample-wise-correction-yes"
                      class="flex cursor-pointer items-center justify-center rounded-md border border-gray-100 bg-white px-3 py-2 text-gray-900 hover:border-gray-200 peer-checked:border-blue-500 peer-checked:bg-blue-500 peer-checked:text-white"
                  >
                    <p class="text-sm font-medium">Yes</p>
                  </label>
                </div>

                <div>
                  <input
                      type="radio"
                      v-model="clusterZOTUsArgs_sample_wise_correction"
                      :value="false"
                      id="clusterZOTUsArgs_sample-wise-correction-no"
                      class="peer hidden"
                      checked
                  />

                  <label
                      for="clusterZOTUsArgs_sample-wise-correction-no"
                      class="flex cursor-pointer items-center justify-center rounded-md border border-gray-100 bg-white px-3 py-2 text-gray-900 hover:border-gray-200 peer-checked:border-blue-500 peer-checked:bg-blue-500 peer-checked:text-white"
                  >
                    <p class="text-sm font-medium">No</p>
                  </label>
                </div>
              </fieldset>
            </div>
            <div class="mt-3">
              <div>
                <label for="clusterZOTUsArgs_match_id">
                  <div class="text-sm font-medium">Minimum identity for mapping reads to zOTUs</div>
                  <div class="text-xs font-mono text-gray-400">match_id</div>
                  <div class="text-xs text-gray-500">Minimum alignment identity for a read to be mapped to a zOTU.</div>
                </label>
                <input
                    id="clusterZOTUsArgs_match_id"
                    type="text"
                    v-model="clusterZOTUsArgs_match_id"
                    placeholder="default: 0.99"
                    class="block w-full px-4 py-2 mt-2 border rounded-md focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring"
                >
              </div>
            </div>
          </div>
          <div class="pt-6" v-if="analysisMode == 'de-novo'">
            <div class="text-lg font-bold">UPARSE (OTU) arguments</div>
            <div class="text-sm text-gray-700">
              Settings for clustering sequences into OTUs with UPARSE.
            </div>
            <div class="mt-3">
              <div>
                <label for="de_novo_minsize">
                  <div class="text-sm font-medium">Minimum number of reads per OTU</div>
                  <div class="text-xs font-mono text-gray-400">minsize</div>
                  <div class="text-xs text-gray-500">Filters out amplicons with fewer reads than this value. Lower values increase sensitivity but may add noise.</div>
                </label>
                <input
                    id="de_novo_minsize"
                    type="text"
                    v-model="deNovoClusterZOTUsArgs_minsize"
                    placeholder="default: 8"
                    class="block w-full px-4 py-2 mt-2 border rounded-md focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring"
                >
              </div>
            </div>
            <div class="mt-3">
              <div>
                <label for="de_novo_abund_limit">
                  <div class="text-sm font-medium">Minimum relative abundance</div>
                  <div class="text-xs font-mono text-gray-400">abund_limit</div>
                  <div class="text-xs text-gray-500">Minimum relative abundance of an OTU across all samples for the OTU to be kept.</div>
                </label>
                <input
                    id="de_novo_abund_limit"
                    type="text"
                    v-model="deNovoClusterZOTUsArgs_abund_limit"
                    placeholder="default: 0.0025"
                    class="block w-full px-4 py-2 mt-2 border rounded-md focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring"
                >
              </div>
            </div>
            <div class="mt-3">
              <label for="de_novo_sample-wise-correction">
                <div class="text-sm font-medium">Sample-wise correction</div>
                <div class="text-xs font-mono text-gray-400">sample_wise_correction</div>
                <div class="text-xs text-gray-500">Relative abundances below the abundance limit (above) are rounded to zero.</div>
              </label>
              <fieldset class="flex flex-wrap gap-3">
                <div>
                  <input
                      type="radio"
                      v-model="deNovoClusterZOTUsArgs_sample_wise_correction"
                      :value="true"
                      id="de_novo_sample-wise-correction-yes"
                      class="peer hidden"
                  />

                  <label
                      for="de_novo_sample-wise-correction-yes"
                      class="flex cursor-pointer items-center justify-center rounded-md border border-gray-100 bg-white px-3 py-2 text-gray-900 hover:border-gray-200 peer-checked:border-blue-500 peer-checked:bg-blue-500 peer-checked:text-white"
                  >
                    <p class="text-sm font-medium">Yes</p>
                  </label>
                </div>

                <div>
                  <input
                      type="radio"
                      v-model="deNovoClusterZOTUsArgs_sample_wise_correction"
                      :value="false"
                      id="de_novo_sample-wise-correction-no"
                      class="peer hidden"
                      checked
                  />

                  <label
                      for="de_novo_sample-wise-correction-no"
                      class="flex cursor-pointer items-center justify-center rounded-md border border-gray-100 bg-white px-3 py-2 text-gray-900 hover:border-gray-200 peer-checked:border-blue-500 peer-checked:bg-blue-500 peer-checked:text-white"
                  >
                    <p class="text-sm font-medium">No</p>
                  </label>
                </div>
              </fieldset>
            </div>
          </div>
          <div class="pt-6" v-if="analysisMode == 'TIC'">
            <div class="text-lg font-bold">Taxonomy-informed clustering (TIC)</div>
            <div class="text-sm text-gray-700">
              Thresholds for taxonomy-informed clustering. Watch out to not set the threshold of a lower rank higher
              than the threshold of a higher rank.
            </div>
            <div class="mt-3">
              <div>
                <label for="family_sim">
                  <div class="text-sm font-medium">Family similarity threshold</div>
                  <div class="text-xs font-mono text-gray-400">family_sim</div>
                  <div class="text-xs text-gray-500">Family alignment identity threshold to group unknown zOTUs into distinct clusters at family level. Sequences with alignment identity more than this value will be taken together as one (unknown) family.</div>
                </label>
                <input
                    id="family_sim"
                    type="text"
                    v-model="complexTICArgs_family_sim"
                    placeholder="default: 0.90"
                    class="block w-full px-4 py-2 mt-2 border rounded-md focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring"
                >
                <div class="relative mb-6">
                  <input
                      type="range"
                      v-model="complexTICArgs_family_sim"
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
                  <div class="text-sm font-medium">Genus similarity threshold</div>
                  <div class="text-xs font-mono text-gray-400">genus_sim</div>
                  <div class="text-xs text-gray-500">Genus alignment identity threshold to group unknown zOTUs into distinct clusters at genus level. Sequences with alignment identity more than this value will be taken together as one (unknown) genus.</div>
                </label>
                <input
                    id="genus_sim"
                    type="text"
                    v-model="complexTICArgs_genus_sim"
                    placeholder="default: 0.95"
                    class="block w-full px-4 py-2 mt-2 border rounded-md focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring"
                >
                <div class="relative mb-6">
                  <input
                      type="range"
                      v-model="complexTICArgs_genus_sim"
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
                  <div class="text-sm font-medium">Species similarity threshold</div>
                  <div class="text-xs font-mono text-gray-400">species_sim</div>
                  <div class="text-xs text-gray-500">Species alignment identity threshold to group unknown zOTUs into distinct clusters at species level. Sequences with alignment identity more than this value will be taken together as one (unknown) species.</div>
                </label>
                <input
                    id="species_sim"
                    type="text"
                    v-model="complexTICArgs_species_sim"
                    placeholder="default: 0.987"
                    class="block w-full px-4 py-2 mt-2 border rounded-md focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring"
                >
                <div class="relative mb-6">
                  <input
                      type="range"
                      v-model="complexTICArgs_species_sim"
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
          <div class="pt-6" v-if="analysisMode == 'TAC'">
            <div class="text-lg font-bold">Taxonomy-agnostic clustering (TAC)</div>
            <div class="text-sm text-gray-700">
              Settings for clustering sequences by similarity alone, without using taxonomy.
            </div>
            <div class="mt-3">
              <div>
                <label for="tac_cluster_thr">
                  <div class="text-sm font-medium">Clustering similarity threshold</div>
                  <div class="text-xs font-mono text-gray-400">cluster_thr</div>
                  <div class="text-xs text-gray-500">Minimum similarity for sequences to be grouped into one cluster.</div>
                </label>
                <input
                    id="tac_cluster_thr"
                    type="text"
                    v-model="tacClusterArgs_cluster_thr"
                    placeholder="default: 0.987"
                    class="block w-full px-4 py-2 mt-2 border rounded-md focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring"
                >
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

const router = useRouter();

let analysisMode = ref("TIC");
let pthreads = ref(1);
let max_threads = ref(1);

function getAnalysisMode() {
  indexBridge.getTacticAnalysisMode().then((mode: string) => {
    console.log("Analysis mode: ", mode);
    analysisMode.value = mode.valueOf();
  });
}
getAnalysisMode();

function setThreadDefaults() {
  indexBridge.getMachineThreads().then((threads: number) => {
    console.log("Machine threads: ", threads);
    max_threads.value = threads;
  }).catch(() => {
    console.error("Could not get machine threads");
  });
  indexBridge.getRecommendedThreads().then((threads: number) => {
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
  indexBridge.publishTacticPreprocessToIndividualZOTUs(preprocessToIndividualZOTUs.value).then(() => {
    console.log("Published preprocessToIndividualZOTUs");
  }).catch(() => {
    console.error("Could not publish preprocessToIndividualZOTUs");
  });
});

let skipNonBacterialFilter = ref(false);

// trigger when skipNonBacterialFilter changes
watchEffect(() => {
  indexBridge.publishTacticSkipNonBacterialFilter(skipNonBacterialFilter.value).then(() => {
    console.log("Published skipNonBacterialFilter");
  }).catch(() => {
    console.error("Could not publish skipNonBacterialFilter");
  });
});

// Arguments exposed in basic mode
// TrimBothSidesArgs and TrimOneSideArgs (stripleft only)
let stripleft = ref(17);
let stripright = ref(21);
// IndividualSampleClusterZOTUsArgs
let individualSampleClusterZOTUsArgs_minsize = ref(2);

// Arguments exposed in expert mode
// MergePairsArgs
let mergePairsArgs_fastq_maxdiffs = ref(50);
let mergePairsArgs_fastq_pctid = ref(50);
let mergePairsArgs_fastq_minmergelen = ref(200);
let mergePairsArgs_fastq_maxmergelen = ref(600);
// FilterBothSidesArgs
let filterBothSidesArgs_fastq_maxee_rate = ref(0.002);
let filterBothSidesArgs_fastq_truncqual = ref(10);
// FilterOneSideArgs
let filterOneSideArgs_fastq_maxee_rate = ref(0.002);
let filterOneSideArgs_fastq_truncqual = ref(10);
// ClusterZOTUsArgs
let clusterZOTUsArgs_minsize = ref(2);
let clusterZOTUsArgs_abund_limit = ref(0.0000);
let clusterZOTUsArgs_sample_wise_correction = ref(false);
let clusterZOTUsArgs_match_id = ref(0.99);
// DeNovoClusterZOTUsArgs
let deNovoClusterZOTUsArgs_minsize = ref(8);
let deNovoClusterZOTUsArgs_abund_limit = ref(0.0025);
let deNovoClusterZOTUsArgs_sample_wise_correction = ref(false);
// ComplexTICArgs
let complexTICArgs_family_sim = ref(0.90);
let complexTICArgs_genus_sim = ref(0.95);
let complexTICArgs_species_sim = ref(0.987);
let complexTICArgs_abund_limit = ref(0.0025);
let complexTICArgs_sample_wise_correction = ref(false);
// TACClusterArgs
let tacClusterArgs_abund_limit = ref(0.0025);
let tacClusterArgs_sample_wise_correction = ref(false);
let tacClusterArgs_cluster_thr = ref(0.987);

const emit = defineEmits(['update:isValid']);
watchEffect(() => {
  emit('update:isValid', true);
});

async function generateTacticPipelineArgumentsObj(): Promise<ITacticArguments> {
  return new Promise<ITacticArguments>((resolve, reject) => {
    const mergePairsArgs: IMergePairsArgs = {
      fastq_maxdiffs: Number(mergePairsArgs_fastq_maxdiffs.value),
      fastq_pctid: Number(mergePairsArgs_fastq_pctid.value),
      fastq_minmergelen: Number(mergePairsArgs_fastq_minmergelen.value),
      fastq_maxmergelen: Number(mergePairsArgs_fastq_maxmergelen.value),
    };

    const trimBothSidesArgs: ITrimBothSidesArgs = {
      stripleft: Number(stripleft.value),  // stripleft applies to both TrimBothSidesArgs and TrimOneSideArgs
      stripright: Number(stripright.value),
    };

    const trimOneSideArgs: ITrimOneSideArgs = {
      stripleft: Number(stripleft.value),  // stripleft applies to both TrimBothSidesArgs and TrimOneSideArgs
    };

    const filterBothSidesArgs: IFilterBothSidesArgs = {
      fastq_maxee_rate: Number(filterBothSidesArgs_fastq_maxee_rate.value),
      fastq_truncqual: Number(filterBothSidesArgs_fastq_truncqual.value),
    };

    const filterOneSideArgs: IFilterOneSideArgs = {
      fastq_maxee_rate: Number(filterOneSideArgs_fastq_maxee_rate.value),
      fastq_truncqual: Number(filterOneSideArgs_fastq_truncqual.value),
    };

    const individualSampleClusterZOTUsArgs: IIndividualSampleClusterZOTUsArgs = {
      minsize: Number(individualSampleClusterZOTUsArgs_minsize.value),
    };

    const clusterZOTUsArgs: IClusterZOTUsArgs = {
      minsize: Number(clusterZOTUsArgs_minsize.value),
      abund_limit: Number(clusterZOTUsArgs_abund_limit.value),
      sample_wise_correction: Boolean(clusterZOTUsArgs_sample_wise_correction.value),
      match_id: Number(clusterZOTUsArgs_match_id.value),
    };

    // get default arguments and patch with user input
    indexBridge.getTacticDefaultParameters().then((defaultArgs: ITacticArguments) => {
      const args = defaultArgs;
      args.MergePairsArgs = mergePairsArgs;
      args.TrimBothSidesArgs = trimBothSidesArgs;
      args.TrimOneSideArgs = trimOneSideArgs;
      args.FilterBothSidesArgs = filterBothSidesArgs;
      args.FilterOneSideArgs = filterOneSideArgs;
      args.IndividualSampleClusterZOTUsArgs = individualSampleClusterZOTUsArgs;
      // keep defaults for Filter16SArgs as this is not exposed
      // keep defaults for BuildZOTUTableArgs as this is not exposed
      // keep defaults for AddTaxArgs as this is not exposed
      args.ClusterZOTUsArgs = clusterZOTUsArgs;

      if (analysisMode.value == "TIC") {
        // set arguments specific for TIC mode
        (args as ITacticArgumentsTICMode).ComplexTICArgs = {
          family_sim: Number(complexTICArgs_family_sim.value),
          genus_sim: Number(complexTICArgs_genus_sim.value),
          species_sim: Number(complexTICArgs_species_sim.value),
          abund_limit: Number(complexTICArgs_abund_limit.value),
          sample_wise_correction: Boolean(complexTICArgs_sample_wise_correction.value),
        };
      } else if (analysisMode.value == "de-novo") {
        // set arguments specific for de-novo clustering mode
        (args as ITacticArgumentsDeNovoMode).DeNovoClusterOTUsArgs = {
          minsize: Number(deNovoClusterZOTUsArgs_minsize.value),
          abund_limit: Number(deNovoClusterZOTUsArgs_abund_limit.value),
          sample_wise_correction: Boolean(deNovoClusterZOTUsArgs_sample_wise_correction.value),
        };
      } else if (analysisMode.value == "TAC") {
        (args as ITacticArgumentsTACMode).TACClusterArgs = {
          abund_limit: Number(tacClusterArgs_abund_limit.value),
          sample_wise_correction: Boolean(tacClusterArgs_sample_wise_correction.value),
          cluster_thr: Number(tacClusterArgs_cluster_thr.value),
        }
      } else {
        reject("Unknown analysis mode: " + analysisMode.value);
      }

      resolve(args);
    }).catch(() => {
      console.error("Could not get default parameters");
      reject();
    });
  });
}

async function apply() {
  return new Promise<void>((resolve, reject) => {
    indexBridge.publishTacticThreads(pthreads.value).then(async () => {
      console.log("Published threads");
      const pipelineArgs = await generateTacticPipelineArgumentsObj();
      console.log("Pipeline arguments: ", pipelineArgs);

      // ensure mapping file is in the correct format
      indexBridge.convertMapping().then(() => {
        console.log("Mapping file converted");

        // publish pipeline arguments
        indexBridge.publishTacticParameters(pipelineArgs).then(() => {
          console.log("Published pipeline arguments");
          resolve();
        }).catch(() => {
          console.error("Could not publish pipeline arguments");
          reject();
        });

      }).catch(() => {
        console.error("Could not convert mapping file");
        reject();
      });

    }).catch(() => {
      console.error("Could not publish threads");
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