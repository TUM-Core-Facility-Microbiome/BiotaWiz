import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  image: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Four Pipelines, One Platform',
    image: '/img/feature-four-pipelines.jpg',
    description: (
      <>
      TACTIC integrates four distinct strategies into a single environment:
      <li><b>TIC & TAC</b>: Advanced hybrid strategies for improved cluster purity and taxonomic assignment of unknown taxa.</li>
      <li><b>Legacy OTU</b>: Traditional OTU clustering for comparability.</li>
      <li><b>zOTU Inference</b>: High-resolution denoising.</li>
      </>
    ),
  },
  {
    title: 'Hybrid Resilience to Diversity Inflation',
    image: '/img/feature-diversity-inflation.jpg',
    description: (
      <>
        While denoising (zOTUs/ASVs) offers high resolution, it often inflates apparent diversity. TACTIC implements Taxonomy-Informed (TIC) and Taxonomy-Agnostic (TAC) clustering to bridge the gap—clustering noise-free sequences to increase resilience against intra-genomic variability while maintaining single-nucleotide precision.
      </>
    ),
  },
  {
    title: 'Run Where You Are: Private & Portable',
    image: '/img/feature-run-where-you-are.jpg',
    description: (
      <>
        TACTIC ensures consistent results across any computing environment.
        <br />
        Choose your interface: power through large datasets with the Docker powered Command Line Interface (CLI) or leverage BiotaWiz, our standalone desktop application, for an intuitive, graphical analysis experience.
      </>
    ),
  },
];

function Feature({title, image, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <figure className={clsx('text--center', styles.featureFigure)}>
        <img className={styles.featureImage} src={useBaseUrl(image)} alt={title} loading="lazy" />
        <figcaption className={styles.imageCredit}>Image created with Gemini 4</figcaption>
      </figure>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
