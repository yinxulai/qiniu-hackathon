import { createClient } from '@hey-api/openapi-ts'

createClient({
  output: 'source/clients/account',
  plugins: ['@hey-api/sdk', '@hey-api/typescript'],
  input: 'https://account.service.taicode.app/reference/openapi.json',
})
