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
        "publishedAt": publishedAt,
        content,
        "readTime": readTime,

      }
    }`);
    return featured;
  } catch (error) {
    console.error('Error fetching featured data:', error);
    throw error;
  }
};

export const getTaleBySlug = async (slug) => {
  try {
    const tale = await client.fetch(
      `*[_type == "tale" && slug.current == $slug]{
        _id,
        title,
        slug,
        "imageURL" : imageURL.asset->url, 
        "author": author->name,
        "authorImage": author->image.asset->url,
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

export const getTalesByCategory = async (category) => {
  try {
    const tales = await client.fetch(
      `*[_type == "tale" && categories[0]->title == $category]{
        title,
        slug,
        "author": author->name,
        "imageURL": imageURL.asset->url
      }`,
      { category }
    );
    return tales;
  } catch (error) {
    console.error('Error fetching tales by category:', error);
    throw error;
  }
};

export const getTalesBySearch = async (search) => {
  try {
    const tales = await client.fetch(
      `*[_type == "tale" && title match $search]{
        title,
        slug,
        "author": author->name,
        "imageURL": imageURL.asset->url
      }`,
      { search }
    );
    return tales;
  } catch (error) {
    console.error('Error fetching tales by search:', error);
    throw error;
  }
};

export const likeStory = async (storyId) => {
  try {
    const story = await client
      .patch(storyId)
      .set({ likes: { increment: 1 } })
      .commit();
    // Handle success, update the UI, etc.
    console.log('Story updated:', story);
  } catch (error) {
    // Handle error
    console.log('An error occurred:', error);
  }
};
