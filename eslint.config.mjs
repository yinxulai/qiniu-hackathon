import globals from 'globals'
import eslint from '@eslint/js'
import electron from 'eslint-plugin-electron'
import tsEslint from 'typescript-eslint'


export default [
  eslint.configs.recommended,
  ...tsEslint.configs.recommended,
  ...tsEslint.configs.recommendedTypeChecked,
  {
    languageOptions: { 
      globals: {
        ...globals.node,
        ...globals.browser
      },
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      }
    }
  },
  {
    rules: {
      'semi': ['error', 'never'],
      'quotes': ['error', 'single'],
      '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error'
    }
  },
  {
    ignores: [
      'source/clients/**/*',
      'node_modules/**',
      'coverage/**',
      'prisma/**',
      'build/**',
      'dist/**',
      '.vite/**'
    ]
  }
]
