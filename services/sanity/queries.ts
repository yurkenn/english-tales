// GROQ Queries for Sanity
export const queries = {
  // Stories
  allStories: `*[_type == "story"] | order(publishedAt desc) {
    _id,
    title,
    slug,
    description,
    coverImage,
    "coverImageLqip": coverImage.asset->metadata.lqip,
    difficulty,
    estimatedReadTime,
    wordCount,
    isFeatured,
    publishedAt,
    "author": author->{_id, name, slug, image},
    "categories": categories[]->{_id, title, slug, color}
  }`,

  featuredStories: `*[_type == "story" && isFeatured == true] | order(publishedAt desc) [0...5] {
    _id,
    title,
    slug,
    description,
    coverImage,
    "coverImageLqip": coverImage.asset->metadata.lqip,
    difficulty,
    estimatedReadTime,
    wordCount,
    publishedAt,
    "author": author->{_id, name, slug, image},
    "categories": categories[]->{_id, title, slug, color}
  }`,

  storyById: `*[_type == "story" && _id == $id][0] {
    _id,
    title,
    slug,
    description,
    content,
    coverImage,
    "coverImageLqip": coverImage.asset->metadata.lqip,
    difficulty,
    estimatedReadTime,
    wordCount,
    isFeatured,
    publishedAt,
    quiz,
    "author": author->{_id, name, slug, image, bio},
    "categories": categories[]->{_id, title, slug, color}
  }`,

  storyBySlug: `*[_type == "story" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    description,
    content,
    coverImage,
    "coverImageLqip": coverImage.asset->metadata.lqip,
    difficulty,
    estimatedReadTime,
    wordCount,
    isFeatured,
    publishedAt,
    quiz,
    "author": author->{_id, name, slug, image, bio},
    "categories": categories[]->{_id, title, slug, color}
  }`,

  storiesByCategory: `*[_type == "story" && $categoryId in categories[]._ref] | order(publishedAt desc) {
    _id,
    title,
    slug,
    description,
    coverImage,
    "coverImageLqip": coverImage.asset->metadata.lqip,
    difficulty,
    estimatedReadTime,
    wordCount,
    publishedAt,
    "author": author->{_id, name, slug, image},
    "categories": categories[]->{_id, title, slug, color}
  }`,

  searchStories: `*[_type == "story" && (
    title match $query ||
    description match $query ||
    author->name match $query
  )] | order(publishedAt desc) {
    _id,
    title,
    slug,
    description,
    coverImage,
    "coverImageLqip": coverImage.asset->metadata.lqip,
    difficulty,
    estimatedReadTime,
    "author": author->{_id, name, slug, image},
    "categories": categories[]->{_id, title, slug, color}
  }`,

  // Authors
  allAuthors: `*[_type == "author"] | order(name asc) {
    _id,
    name,
    slug,
    image,
    bio,
    nationality,
    isFeatured
  }`,

  featuredAuthor: `*[_type == "author" && isFeatured == true][0] {
    _id,
    name,
    slug,
    image,
    bio,
    nationality,
    "storyCount": count(*[_type == "story" && references(^._id)])
  }`,

  authorById: `*[_type == "author" && _id == $id][0] {
    _id,
    name,
    slug,
    image,
    bio,
    nationality,
    birthYear,
    deathYear,
    "stories": *[_type == "story" && references(^._id)] | order(publishedAt desc) {
      _id,
      title,
      slug,
      coverImage,
      "coverImageLqip": coverImage.asset->metadata.lqip,
      difficulty,
      estimatedReadTime
    }
  }`,

  // Categories
  allCategories: `*[_type == "category"] | order(order asc) {
    _id,
    title,
    slug,
    description,
    icon,
    color,
    "storyCount": count(*[_type == "story" && references(^._id)])
  }`,

  // Reviews
  reviewsByStory: `*[_type == "review" && story._ref == $storyId && isApproved == true] | order(createdAt desc) {
    _id,
    userId,
    userName,
    userAvatar,
    rating,
    text,
    createdAt
  }`,

  storyRating: `{
    "averageRating": math::avg(*[_type == "review" && story._ref == $storyId && isApproved == true].rating),
    "totalReviews": count(*[_type == "review" && story._ref == $storyId && isApproved == true])
  }`,
};
