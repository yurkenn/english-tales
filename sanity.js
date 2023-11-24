import { createClient } from '@sanity/client';
import ImageUrlBuilder from '@sanity/image-url';

export const client = createClient({
  projectId: process.env.EXPO_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.EXPO_PUBLIC_SANITY_DATASET,
  token: process.env.EXPO_PUBLIC_SANITY_TOKEN,
  apiVersion: '2021-10-21',
  useCdn: false,
});

const builder = ImageUrlBuilder(client);

export const urlFor = (source) => builder.image(source);
