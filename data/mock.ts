// Mock data for UI development
import { Story, User, ReadingProgress, LibraryItem, Settings } from '@/types';

// Mock user
export const mockUser: User = {
    id: 'user-1',
    email: 'alex@example.com',
    displayName: 'Alex',
    photoURL: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAE5uoNWh5pQMEiYz1zm5QHnE1-Q8uiuufTGr58zpxgb_gSegiLrz9vHW6V4dphex_xOSDRXhfjKgtwS5ziAuhXbA1dmIV5H03nKuQJQpCGSFniVTDeXECaTG1hVELrtI3L-iYiJ9jn49UGb9g1o-D11gygAvDN40Tbt1Sq9h8dgJi06s6xQW1rdwRUrRCPoiY4K-x7E7SMP6jB8bn3Q0B3GdehHAYTA2WepmxtmrGlk0zXKGjVL1ZoQKew-fz1bOSCnxd6jUfatgE',
    createdAt: new Date('2024-01-15'),
    isAnonymous: false,
};

// Genre list
export const genres = [
    'For You',
    'Mystery',
    'Romance',
    'Sci-Fi',
    'History',
    'Fantasy',
    'Classics',
] as const;

// Mock stories
export const mockStories: Story[] = [
    {
        id: 'story-1',
        title: 'The Great Gatsby',
        description: 'A tale of wealth, love, and the American Dream in the Jazz Age.',
        content: 'In my younger and more vulnerable years my father gave me some advice...',
        coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBiZZ4TQQk1mp5dWD1p5EOx7PylpwbRwCtjd_CAiEOtdZidfgE9rt6lU9QKxlabkKtJa9GLenu7-TKOk_GbH0jETuoDf0gOE18GhJZ5k12AQUgmIrpQZ1NOxZh55-m6WlrH7vdpcRY-aQjb4Lqt5q4GXtEa5o_0fNFm9lh46ZpCTt3_vqbDS69S9TJQW3srLnGk9o7HnaXG7VC-iaVS_2Rl1nVH-YP1xcH2V8HuZQq-qqP6g65LW0HD1E3YtD5HAirxGz9HT1h3WUA',
        author: 'F. Scott Fitzgerald',
        difficulty: 'intermediate',
        estimatedReadTime: 180,
        wordCount: 47094,
        tags: ['Classics', 'Romance'],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
    },
    {
        id: 'story-2',
        title: 'Midnight Library',
        description: 'Between life and death there is a library, and within that library, the shelves go on forever.',
        content: 'It was a library. An immense library. A vast universe of books...',
        coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC7QJ4EAvR-jYKZDWc3g6BhlEex0ZheyxRUaWa9Er62Gyug5obAYizWcjiPGAMQCxq8Ajt5GvcmXtStu_nlauJd0Db1OgfArjufdGl3YmgLb5fXdMH2Pa_7dCRzuNmLz-pIg0Qt4zfEAF6SPrgDq_3afvWv8xOr9UUHsq9qPU8mFx2-25GTMdrvFC-0vFkUvevdPCOHnBa632W7dhYkVo1ZWeBDgVN45eobPKZ2KutHTKtWNkFIiWGeNolp2CMSHQ80aE9TND8bw8U',
        author: 'Matt Haig',
        difficulty: 'intermediate',
        estimatedReadTime: 240,
        wordCount: 65000,
        tags: ['Fiction', 'Fantasy'],
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10'),
    },
    {
        id: 'story-3',
        title: '1984',
        description: 'A dystopian novel about totalitarianism and surveillance.',
        content: 'It was a bright cold day in April, and the clocks were striking thirteen...',
        coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCp7ulpvWxne9zmYGySt3Mml3CdHD6bETOQMiQ9nquP92GrpK57D4cPzVb1uoOT91UqSe51ucF8VsAojaCgFKuC3b1upQzqmXO_EXwx5IZQTM6-tgRbeDt4EbsOyF37jui10ikW8_F-mKV9AdZqM4Cs_GFdSR-KlVlBnoqxRQ8AWpJWQ4Gd97CDXtPd0zQ8K095HAs_S4bu3z2a9srADM10nBtUmEZ-J1rzgXWons9pL7AUHUIKfNl1zenqC0I2-g_GZpfZpsGS_oQ',
        author: 'George Orwell',
        difficulty: 'advanced',
        estimatedReadTime: 300,
        wordCount: 89000,
        tags: ['Classics', 'Sci-Fi'],
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-05'),
    },
    {
        id: 'story-4',
        title: 'Pride & Prejudice',
        description: 'A witty romance between Elizabeth Bennet and Mr. Darcy.',
        content: 'It is a truth universally acknowledged...',
        coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDZAoLd6jLM95FuIspPKgarBGpzJiSVQXr3Qw2RwgLzSXyPl82HAfa-Uk6sDgJRBWnpjMhekiI1B3zevV4dMkgaBQywl_8whTfMvQwWBOZqUndggKcpKPEI2UzSIgUXLi4JIhBTyIhu7K9am4EsKefcXfBHnVR_RxFi5Oh00IMgFyGBsc1PY3QBVIxR8LVXZtuIq1Mf7TYqPiwyKYTuVSYhQk443M9_LIplowOodBLp7OKEgXcdKY0ruKJSV14piw3lq3Y8HvijM8w',
        author: 'Jane Austen',
        difficulty: 'intermediate',
        estimatedReadTime: 360,
        wordCount: 122000,
        tags: ['Classics', 'Romance'],
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02'),
    },
    {
        id: 'story-5',
        title: 'Dune',
        description: 'An epic science fiction saga set on the desert planet Arrakis.',
        content: 'A beginning is the time for taking the most delicate care...',
        coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA9Z9DkLa37D5B_UzTFUiFTfRzOmSCPJ9cLL7hjce74Qd5Ln-2W5b1EhYvzfB4biENxIuiOhGfRNy_l4VSmP0r2ryv0WGFe5rxj3CahMou8qdYuOnSOiPshXOn-YMD96SCt7nqOqSi9yKwJUmoBu7IXnkYzrELqxEbo8_pz9kjeT7jI2HGM5jnagqn458LZXJLrpR-8-QC05A_tcYb96vyO55zJO1uZBNb4JRLM3LJySPm3_G4117ykKqoI_5-S6YRCoCCdGUl5SQw',
        author: 'Frank Herbert',
        difficulty: 'advanced',
        estimatedReadTime: 600,
        wordCount: 188000,
        tags: ['Sci-Fi', 'Fantasy'],
        createdAt: new Date('2024-01-08'),
        updatedAt: new Date('2024-01-08'),
    },
    {
        id: 'story-6',
        title: 'The Hobbit',
        description: 'Bilbo Baggins embarks on an unexpected journey.',
        content: 'In a hole in the ground there lived a hobbit...',
        coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCOXGWtTL6o2odySwXSezecKogsTIHMymvUOGrQumP4VxlbOm7c6r7H4sbjYCuUN82GbthKbwUofQUIwt_0D0z8i_FtM9QMmGKKjsWZVZpCfhFZoAABdLWwwAYSjMu_g-rctRm08sy6zNdk4CfzhHJNFrSqmfbKMeO9ZxbuX_USopAZ6SEbdI02tJOZGWCx7tDe7pMqLxeqm_7rLj7DoJ76_NFCg4C46z24tTx6c7H-UjvnYN51wIINRedkInLpl0yBRHmm0Vkt__0',
        author: 'J.R.R. Tolkien',
        difficulty: 'beginner',
        estimatedReadTime: 300,
        wordCount: 95000,
        tags: ['Fantasy', 'Adventure'],
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-03'),
    },
    {
        id: 'story-7',
        title: 'The Silent Patient',
        description: 'A psychotherapist becomes obsessed with a patient who shot her husband.',
        content: 'Alicia Berenson did not say a word for six years...',
        coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA2k0BnyG4sqVg1RGbndazLDNCHA7AdXaet7JCzNzmoCro_ihFqk2eW-aiaj_1QqiL3UBqZy-4e0WhMs5cEojQ6UCxErx5kxFimy3XWXOvsGCg0OZ_DxyIlFe2bPpqkz9OuCI44sB5ynjmpZ7l7KivS2K0-PFGPtEGjQniKpvUIujWvd2MyHYLk2kMy5_c1E0r2j3zSipQGkFhAmyZnZ13grb-qUwHlUdIZ-HqQ9Rui3kheTeThrow0vBzGzwr4Adi2jaWit6riYEA',
        author: 'Alex Michaelides',
        difficulty: 'intermediate',
        estimatedReadTime: 240,
        wordCount: 75000,
        tags: ['Mystery', 'Thriller'],
        createdAt: new Date('2024-01-12'),
        updatedAt: new Date('2024-01-12'),
    },
    {
        id: 'story-8',
        title: 'Normal People',
        description: 'A contemporary love story between two Irish teenagers.',
        content: 'Marianne answers the door when Connell rings the bell...',
        coverImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAqsmdB5upvMM8MPYSI2egYyB_P_KK8NfaJa32TCrhkQ6IXfNZOIj6S1A_NdbyGFifBXzyozMhEykRXlowjJ267KdSVAAHjfOdAZybqdh7QAVrOb2X_RYMX_af2JZ3JxX8fuuofGU3iBlNXGNVgrbNRwnS_iWL7o5cL5QDz0wvAPNCxYYWj4NzAd8diXajOUCXaI6cSesgUloJsZ-HVbzaob5i6eink7AJpg64huhLNZuBdiHCKRbhArAitQCsIZAKlFTWk8cTKCl8',
        author: 'Sally Rooney',
        difficulty: 'intermediate',
        estimatedReadTime: 200,
        wordCount: 63000,
        tags: ['Romance', 'Contemporary'],
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
    },
];

// Mock reading progress
export const mockProgress: Record<string, ReadingProgress> = {
    'story-1': {
        storyId: 'story-1',
        userId: 'user-1',
        currentPosition: 11774,
        percentage: 25,
        lastReadAt: new Date(),
        isCompleted: false,
    },
    'story-3': {
        storyId: 'story-3',
        userId: 'user-1',
        currentPosition: 44500,
        percentage: 50,
        lastReadAt: new Date(),
        isCompleted: false,
    },
};

// Mock library items
export const mockLibrary: LibraryItem[] = [
    {
        storyId: 'story-1',
        userId: 'user-1',
        addedAt: new Date('2024-01-20'),
        story: mockStories[0],
        progress: mockProgress['story-1'],
    },
    {
        storyId: 'story-3',
        userId: 'user-1',
        addedAt: new Date('2024-01-22'),
        story: mockStories[2],
        progress: mockProgress['story-3'],
    },
    {
        storyId: 'story-6',
        userId: 'user-1',
        addedAt: new Date('2024-01-25'),
        story: mockStories[5],
    },
];

// Mock reviews
export interface Review {
    id: string;
    storyId: string;
    userId: string;
    userName: string;
    userAvatar: string;
    rating: number;
    text: string;
    createdAt: Date;
}

export const mockReviews: Review[] = [
    {
        id: 'review-1',
        storyId: 'story-2',
        userId: 'user-2',
        userName: 'Sarah M.',
        userAvatar: 'https://randomuser.me/api/portraits/women/1.jpg',
        rating: 5,
        text: 'Absolutely beautiful and thought-provoking. Made me reflect on my own life choices.',
        createdAt: new Date('2024-01-18'),
    },
    {
        id: 'review-2',
        storyId: 'story-2',
        userId: 'user-3',
        userName: 'James K.',
        userAvatar: 'https://randomuser.me/api/portraits/men/2.jpg',
        rating: 4,
        text: 'A unique concept executed well. The middle dragged a bit but the ending was perfect.',
        createdAt: new Date('2024-01-16'),
    },
    {
        id: 'review-3',
        storyId: 'story-2',
        userId: 'user-4',
        userName: 'Emily R.',
        userAvatar: 'https://randomuser.me/api/portraits/women/3.jpg',
        rating: 5,
        text: 'I couldn\'t put it down! Such an imaginative and heartwarming story.',
        createdAt: new Date('2024-01-14'),
    },
];

// Featured story (Daily Pick)
export const featuredStory = mockStories[1];

// Author spotlight
export interface Author {
    id: string;
    name: string;
    bio: string;
    imageUrl: string;
    bookCount: number;
}

export const featuredAuthor: Author = {
    id: 'author-1',
    name: 'Neil Gaiman',
    bio: 'Dive into the fantastical worlds of a modern master storyteller. Discover tales of dreams and magic.',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB1LeMJtqec3kvmmT1ylQuICrRVY4XvNKSM45SXtehX3fEDBp1iw5n6zfiE2VkK-CIIVKTItSZYLMYWyzZzEpCUTodCUdYjFXpkiF-3_dAxPHZDJ2aWbwBni5E3k9ta1Mg_BHeEP-vwBKhI43GlTTELF2cl000-4VHU_I-F2xy3TSZnTPxvLRsFoXYWJ0nW-7qIW7BnTqUBL2zGXs9S35qfJIKFQvuNl6q4vI8mMN56JbzrrnQzo_FixRLLROUeJufsBT2K7SAThLY',
    bookCount: 12,
};

// Trending stories (subset)
export const trendingStories = mockStories.slice(0, 4);

// Recommended stories
export const recommendedStories = mockStories.slice(3, 8);

// User stats
export interface UserStats {
    booksRead: number;
    pagesRead: number;
    readingStreak: number;
    minutesRead: number;
}

export const mockUserStats: UserStats = {
    booksRead: 12,
    pagesRead: 3420,
    readingStreak: 7,
    minutesRead: 1580,
};

// Helper to get story by id
export const getStoryById = (id: string): Story | undefined => {
    return mockStories.find((story) => story.id === id);
};

// Helper to get reviews for story
export const getReviewsForStory = (storyId: string): Review[] => {
    return mockReviews.filter((review) => review.storyId === storyId);
};

// Get story rating (average from reviews)
export const getStoryRating = (storyId: string): { rating: number; count: number } => {
    const reviews = getReviewsForStory(storyId);
    if (reviews.length === 0) {
        // Return mock ratings based on story id
        const ratings: Record<string, { rating: number; count: number }> = {
            'story-1': { rating: 4.8, count: 2400 },
            'story-2': { rating: 4.8, count: 2400 },
            'story-3': { rating: 4.9, count: 3100 },
            'story-4': { rating: 4.7, count: 1800 },
            'story-5': { rating: 4.8, count: 2200 },
            'story-6': { rating: 4.9, count: 4500 },
            'story-7': { rating: 4.5, count: 980 },
            'story-8': { rating: 4.2, count: 650 },
        };
        return ratings[storyId] || { rating: 4.5, count: 100 };
    }
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return { rating: sum / reviews.length, count: reviews.length };
};
