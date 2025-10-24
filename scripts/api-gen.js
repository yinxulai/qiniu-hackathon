import { createClient } from '@hey-api/openapi-ts'

createClient({
  output: 'view/apis',
  plugins: ['@hey-api/sdk', '@hey-api/typescript'],
  input: 'http://localhost:52662/openapi.json',
})
