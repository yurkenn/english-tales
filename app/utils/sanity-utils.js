import { client } from '../../sanity';

export const getFeatured = async () => {
  try {
    const featured = await client.fetch(`*[_type == "featured"]{
      title,
      description,
       "imageURL" : imageURL.asset->url,
      "tales": tales[]->{
        title,
        slug,
        "category": categories[0]->title,
        "author": author->name,
        "imageURL": imageURL.asset->url,
        "likes": likes,
        "publishedAt": publishedAt,
        content

      }
    }`);
    return featured;
  } catch (error) {
    console.error('Error fetching featured data:', error);
    throw error;
  }
};

export const getTales = async () => {
  try {
    const tales = await client.fetch(`*[_type == "tale"]{
      title,
      slug,
      "imageURL": imageURL.asset->url
    }`);
    return tales;
  } catch (error) {
    console.error('Error fetching tales:', error);
    throw error;
  }
};

export const getTaleBySlug = async (slug) => {
  try {
    const tale = await client.fetch(
      `*[_type == "tale" && slug.current == $slug]{
        title,
        slug,
        "imageURL" : imageURL.asset->url, 
        "author": author->name,
        "authorImage": author->image,
        "category": categories[0]->title,
        content,
      }`,
      { slug }
    );
    return tale;
  } catch (error) {
    console.error('Error fetching tale by slug:', error);
    throw error;
  }
};

export const getCategories = async () => {
  try {
    const categories = await client.fetch(`*[_type == "category"]{
      title
    }`);
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};
