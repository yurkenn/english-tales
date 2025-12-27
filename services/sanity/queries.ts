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
    "categories": categories[]->{_id, title, slug, color},
    isPremiumOnly
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
    "categories": categories[]->{_id, title, slug, color},
    isPremiumOnly
  }`,

  // Daily Pick - Returns story scheduled for today, or fallback to latest featured
  dailyPick: `coalesce(
    *[_type == "story" && dailyPickDate == $today][0] {
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
      "categories": categories[]->{_id, title, slug, color},
      isPremiumOnly
    },
    *[_type == "story" && isFeatured == true] | order(publishedAt desc) [0] {
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
      "categories": categories[]->{_id, title, slug, color},
      isPremiumOnly
    }
  )`,


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
    "categories": categories[]->{_id, title, slug, color},
    isPremiumOnly
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
    "categories": categories[]->{_id, title, slug, color},
    isPremiumOnly
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
    "categories": categories[]->{_id, title, slug, color},
    isPremiumOnly
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
    "categories": categories[]->{_id, title, slug, color},
    isPremiumOnly
  }`,

  // Authors
  allAuthors: `*[_type == "author"] {
    _id,
    name,
    slug,
    image,
    bio,
    nationality,
    birthYear,
    deathYear,
    isFeatured,
    "storyCount": count(*[_type == "story" && author._ref == ^._id])
  } | order(storyCount desc, name asc)`,

  featuredAuthor: `*[_type == "author" && isFeatured == true][0] {
    _id,
    name,
    slug,
    image,
    bio,
    nationality,
    "storyCount": count(*[_type == "story" && author._ref == ^._id])
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
    "storyCount": count(*[_type == "story" && author._ref == ^._id]),
    "stories": *[_type == "story" && author._ref == ^._id] | order(publishedAt desc) {
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
      "author": { "name": ^.name, "_id": ^._id },
      isPremiumOnly
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
    "storyCount": count(*[_type == "story" && ^._id in categories[]._ref])
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
