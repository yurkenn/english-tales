import {defineConfig} from 'sanity'
// @ts-ignore - defineConfig exists but TypeScript definitions may be incomplete
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'blue-hare',

  projectId: 'c5kac9s9',
  dataset: 'production',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
