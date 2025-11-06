import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: [
    'src/main.tsx',
    'vite.config.ts',
    'vitest.config.ts',
    'src/**/*.test.ts',
    'src/**/*.test.tsx',
  ],
  project: ['src/**/*.{ts,tsx}'],
  ignore: [
    'dist/**',
    'node_modules/**',
    '**/*.d.ts',
  ],
  ignoreDependencies: [
    '@eslint/js',
    '@tailwindcss/forms',
    '@tailwindcss/typography',
    '@tailwindcss/vite',
    'globals',
    'shadcn',
    'tw-animate-css',
  ],
  paths: {
    '@/*': ['./src/*'],
  },
  vite: {
    config: 'vite.config.ts',
  },
};

export default config;

