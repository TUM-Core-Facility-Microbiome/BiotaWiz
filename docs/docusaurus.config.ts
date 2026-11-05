import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'TACTIC & BiotaWiz',
  tagline: 'Robust 16S rRNA Amplicon Analysis',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
    // v4 also enables the Rspack-based "Faster" bundler, which needs the extra @docusaurus/faster package
    faster: false,
  },

  // Set the production url of your site here
  url: 'https://tum-core-facility-microbiome.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/BiotaWiz/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'TUM-Core-Facility-Microbiome', // Usually your GitHub org/user name.
  projectName: 'BiotaWiz', // Usually your repo name.

  onBrokenLinks: 'throw',
  markdown: {
    // the pages use {#id} heading anchors and <!-- --> comments, which future.v4 would switch off
    mdx1Compat: {
      comments: true,
      admonitions: true,
      headingIds: true,
    },
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/TUM-Core-Facility-Microbiome/BiotaWiz/tree/main/docs/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: 'TACTIC & BiotaWiz Documentation',
      logo: {
        alt: 'BiotaWiz logo',
        src: 'img/logo.png',
      },
      items: [
        // {
        //   type: 'docSidebar',
        //   sidebarId: 'tutorialSidebar',
        //   position: 'left',
        //   label: 'Tutorial',
        // },
        {
          href: 'https://github.com/TUM-Core-Facility-Microbiome/BiotaWiz',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Documentation',
              to: '/docs/intro',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Discussion (GitHub)',
              href: 'https://github.com/TUM-Core-Facility-Microbiome/BiotaWiz/discussions',
            },
            {
              label: 'Report Issues (GitHub)',
              href: 'https://github.com/TUM-Core-Facility-Microbiome/BiotaWiz/issues',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/TUM-Core-Facility-Microbiome/BiotaWiz',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} BiotaWiz Developers. Documentation built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
