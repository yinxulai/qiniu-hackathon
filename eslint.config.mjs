import globals from 'globals'
import eslint from '@eslint/js'
import  eslint from 'electron'
import tsEslint from 'typescript-eslint'


export default [
  eslint.configs.recommended,
  ...tsEslint.configs.recommended,
  ...electron.configs.recommended,
  { languageOptions: { globals: globals.node } },
  {
    rules: {
      'semi': ['error', 'never'],
      'quotes': ['error', 'single']
    }
  },
  {
    ignores: [
      'source/clients/**/*',
      'node_modules/**',
      'coverage/**',
      'prisma/**',
      'build/**'
    ]
  }
]
