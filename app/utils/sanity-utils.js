import AsyncStorage from '@react-native-async-storage/async-storage';
import { client } from '../../sanity';

export const getFeatured = async () => {
  try {
    const featured = await client.fetch(`*[_type == "featured"]{
      title,
      description,
      "imageURL" : imageURL.asset->url,
      "tales": tales[]->{
        _id,
        likes,
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
    throw new Error('Error fetching featured data' + error.message);
  }
};

export const getTaleBySlug = async (slug) => {
  try {
    const tale = await client.fetch(
      `*[_type == "tale" && slug.current == $slug]{
        _id,
        title,
        likes,
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
    throw new Error('Error fetching tale by slug' + error.message);
  }
};

export const getCategories = async () => {
  try {
    const categories = await client.fetch(`*[_type == "category"]{
      title,
      'icon' : icon.asset->url
    }`);
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw new Error('Error fetching categories' + error.message);
  }
};

export const getTalesByCategory = async (category) => {
  try {
    const tales = await client.fetch(
      `*[_type == "tale" && categories[0]->title == $category]{
        title,
        icon,
        slug,
        "author": author->name,
        "imageURL": imageURL.asset->url
      }`,
      { category }
    );
    return tales;
  } catch (error) {
    console.error('Error fetching tales by category:', error);
    throw new Error('Error fetching tales by category' + error.message);
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
    throw new Error('Error fetching tales by search' + error.message);
  }
};

export const fetchLikes = async (taleId) => {
  try {
    const result = await client.fetch(`*[_id == $taleId]{likes}[0].likes`, { taleId });
    return result;
  } catch (error) {
    console.error(`Error fetching likes for tale ${taleId}: ${error.message}`);
    throw new Error(`Error fetching likes for tale ${taleId}: ${error.message}`);
  }
};

export const updateLikes = async (taleId, likes) => {
  try {
    const result = await client.patch(taleId).set({ likes }).commit();
    console.log(`Likes updated for tale ${taleId}: ${result.likes}`);
  } catch (error) {
    console.error(`Error updating likes for tale ${taleId}: ${error.message}`);
  }
};

export const unlikeTale = async (taleId, likes) => {
  try {
    const result = await client.patch(taleId).set({ likes }).commit();
    console.log(`Likes updated for tale ${taleId}: ${result.likes}`);
  } catch (error) {
    console.error(`Error updating likes for tale ${taleId}: ${error.message}`);
  }

  try {
    await AsyncStorage.removeItem(`liked_${taleId}`);
  } catch (error) {
    console.error(`Error removing like status for tale ${taleId}: ${error.message}`);
  }
};

export const getAllTales = async () => {
  try {
    const tales = await client.fetch(`*[_type == "tale"]{
      title,
      slug,
      "author": author->name,
      "imageURL": imageURL.asset->url
    }`);
    return tales;
  } catch (error) {
    console.error('Error fetching all tales:', error);
    throw new Error('Error fetching all tales' + error.message);
  }
};
