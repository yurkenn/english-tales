import { client } from '../../sanity';

// Cache implementation for optimizing repeated queries
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getFromCache = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCache = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
};

export const getFeatured = async () => {
  const cacheKey = 'featured';
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const featured = await client.fetch(`*[_type == "featured"]{
      _id,
      title,
      description,
      "imageURL": imageURL.asset->url,
      "tales": tales[]->{
        _id,
        title,
        slug,
        description,
        likes,
        "category": categories[0]->{
          title,
          color,
          iconName
        },
        "author": author->{
          name,
          "image": image.asset->url
        },
        "imageURL": imageURL.asset->url,
        estimatedDuration,
        level,
        difficulty,
        topics,
        publishedAt
      }
    }`);

    setCache(cacheKey, featured);
    return featured;
  } catch (error) {
    console.error('Error fetching featured data:', error);
    throw new Error('Error fetching featured data: ' + error.message);
  }
};

export const getTaleBySlug = async (slug) => {
  const cacheKey = `tale_${slug}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const tale = await client.fetch(
      `
     *[_type == "tale" && slug.current == $slug]{
       _id,
       title,
       likes,
       slug,
       estimatedDuration,
       level,
       difficulty,
       description,
       content,
       vocabulary,
       grammarFocus,
       topics,
       "imageURL": imageURL.asset->url,
       "author": author->{
         name,
         bio,
         expertise,
         qualification,
         "image": image.asset->url
       },
       "category": categories[0]->{
         title,
         color,
         iconName
       },
       "related": *[_type == "tale" && 
         categories[0]->title == ^.categories[0]->title && 
         slug.current != $slug] | order(publishedAt desc)[0...4]{
         _id,
         title,
         slug,
         description,
         difficulty,
         estimatedDuration,
         "imageURL": imageURL.asset->url,
          likes,
          "author": author->{
            name,
            "image": image.asset->url
          },
          level,
          

       }
     }`,
      { slug }
    );

    setCache(cacheKey, tale);
    return tale;
  } catch (error) {
    console.error('Error fetching tale by slug:', error);
    throw new Error('Error fetching tale by slug: ' + error.message);
  }
};

export const getCategories = async () => {
  const cacheKey = 'categories';
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const categories = await client.fetch(`*[_type == "category"] | order(order asc) {
      _id,
      title,
      description,
      iconName,
      color,
      "slug": slug.current,
      "talesCount": count(*[_type == "tale" && references(^._id)])
    }`);

    setCache(cacheKey, categories);
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw new Error('Error fetching categories: ' + error.message);
  }
};

export const getTalesByCategory = async (category) => {
  const cacheKey = `category_tales_${category}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const tales = await client.fetch(
      `*[_type == "tale" && categories[0]->title == $category]{
        _id,
        title,
        likes,
        slug,
        estimatedDuration,
        level,
        difficulty,
        description,
        "imageURL": imageURL.asset->url,
        "author": author->{
          name,
          "image": image.asset->url
        },
        "category": categories[0]->{
          title,
          color,
          iconName
        }
      }`,
      { category }
    );

    setCache(cacheKey, tales);
    return tales;
  } catch (error) {
    console.error('Error fetching tales by category:', error);
    throw new Error('Error fetching tales by category: ' + error.message);
  }
};

export const getTalesBySearch = async (search) => {
  if (!search) return [];

  try {
    const tales = await client.fetch(
      `*[_type == "tale" && (
        title match $search + "*" ||
        description match $search + "*" ||
        author->name match $search + "*"
      )]{
        _id,
        title,
        slug,
        description,
        estimatedDuration,
        level,
        difficulty,
        "imageURL": imageURL.asset->url,
        "author": author->name,
        likes
      }`,
      { search: search.toLowerCase() }
    );
    return tales;
  } catch (error) {
    console.error('Error fetching tales by search:', error);
    throw new Error('Error fetching tales by search: ' + error.message);
  }
};

export const getAllTales = async () => {
  const cacheKey = 'all_tales';
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const tales = await client.fetch(`*[_type == "tale"] | order(publishedAt desc) {
      _id,
      title,
      slug,
      description,
      estimatedDuration,
      level,
      difficulty,
      "author": author->name,
      "imageURL": imageURL.asset->url,
      likes,
      publishedAt
    }`);

    setCache(cacheKey, tales);
    return tales;
  } catch (error) {
    console.error('Error fetching all tales:', error);
    throw new Error('Error fetching all tales: ' + error.message);
  }
};

// Like functionality
export const fetchLikes = async (taleId) => {
  try {
    const result = await client.fetch(`*[_type == "tale" && _id == $taleId].likes[0]`, { taleId });
    return result || 0;
  } catch (error) {
    console.error(`Error fetching likes for tale ${taleId}:`, error);
    throw error;
  }
};

export const updateLikes = async (taleId, likes) => {
  try {
    const result = await client.patch(taleId).set({ likes }).commit();

    // Invalidate related caches
    cache.delete(`tale_${result.slug.current}`);
    cache.delete('featured');
    cache.delete('all_tales');

    return result.likes;
  } catch (error) {
    console.error(`Error updating likes for tale ${taleId}:`, error);
    throw error;
  }
};

// Author related queries
export const getAuthorDetails = async (authorId) => {
  try {
    const author = await client.fetch(
      `*[_type == "author" && _id == $authorId]{
        name,
        bio,
        "image": image.asset->url,
        expertise,
        qualification,
        "tales": *[_type == "tale" && references(^._id)]{
          _id,
          title,
          slug,
          description,
          "imageURL": imageURL.asset->url,
          likes,
          estimatedDuration
        }
      }[0]`,
      { authorId }
    );
    return author;
  } catch (error) {
    console.error('Error fetching author details:', error);
    throw error;
  }
};
