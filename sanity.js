import { createClient } from '@sanity/client';
import ImageUrlBuilder from '@sanity/image-url';
import Config from 'react-native-config';

export const client = createClient({
  projectId: Config.SANITY_PROJECT_ID,
  dataset: Config.SANITY_DATASET,
  token: Config.SANITY_TOKEN,
  apiVersion: '2021-10-21',
  useCdn: false,
});

const builder = ImageUrlBuilder(client);

export const urlFor = (source) => builder.image(source);
