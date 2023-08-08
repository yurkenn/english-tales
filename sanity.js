import { createClient } from '@sanity/client';
import ImageUrlBuilder from '@sanity/image-url';
import Config from 'react-native-config';

const client = createClient({
  projectId: Config.SANITY_PROJECT_ID,
  dataset: Config.SANITY_DATASET,
  apiVersion: '2021-10-21',
  useCdn: true,
});

const builder = ImageUrlBuilder(client);

export const urlFor = (source) => builder.image(source);

export const getPosts = async () => {
  const posts = await client.fetch(
    `*[_type == "post"]{
        title,
        slug,
        body,
        mainImage{
            asset->{
            _id,
            url
            },
            alt
        }
        }`
  );
  return posts;
};

export const getPostBySlug = async (slug) => {
  const post = await client.fetch(
    `*[_type == "post" && slug.current == $slug]{
        title,
        slug,
        mainImage{
            asset->{
            _id,
            url
            },
            alt
        },
        body,
        "name": author->name,
        "authorImage": author->image
        }`,
    { slug }
  );
  return post;
};

export const getCategories = async () => {
  const categories = await client.fetch(
    `*[_type == "category"]{
        title,
        slug
        }`
  );
  return categories;
};

export const getCategoryBySlug = async (slug) => {
  const category = await client.fetch(
    `*[_type == "category" && slug.current == $slug]{
        title,
        slug
        }`,
    { slug }
  );
  return category;
};

export const getAuthorBySlug = async (slug) => {
  const author = await client.fetch(
    `*[_type == "author" && slug.current == $slug]{
        name,
        image,
        bio
        }`,
    { slug }
  );
  return author;
};

export const getAuthorPosts = async (slug) => {
  const posts = await client.fetch(
    `*[_type == "post" && author->slug.current == $slug]{
        title,
        slug,
        mainImage{
            asset->{
            _id,
            url
            },
            alt
        }
        }`,
    { slug }
  );
  return posts;
};
