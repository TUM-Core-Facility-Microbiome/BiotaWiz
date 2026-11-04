import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Four Pipelines, One Platform',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
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
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        While denoising (zOTUs/ASVs) offers high resolution, it often inflates apparent diversity. TACTIC implements Taxonomy-Informed (TIC) and Taxonomy-Agnostic (TAC) clustering to bridge the gap—clustering noise-free sequences to increase resilience against intra-genomic variability while maintaining single-nucleotide precision.
      </>
    ),
  },
  {
    title: 'Run Where You Are: Private & Portable',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        TACTIC ensures consistent results across any computing environment.
        <br />
        Choose your interface: power through large datasets with the Docker powered Command Line Interface (CLI) or leverage BiotaWiz, our standalone desktop application, for an intuitive, graphical analysis experience.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
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
