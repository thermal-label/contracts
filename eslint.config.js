import config from '@mbtech-nl/eslint-config';

// Local override: `import-x/consistent-type-specifier-style: prefer-inline`
// in the shared config conflicts with `@typescript-eslint/no-import-type-side-effects`
// for pure type-only imports. Inline form leaves an empty runtime import
// (`import {}`) behind with `verbatimModuleSyntax`, so we prefer top-level
// `import type` for type-only imports. Mixed imports still go inline.
// See DECISIONS.md D9.
export default [
  ...config,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'import-x/consistent-type-specifier-style': 'off',
    },
  },
];
