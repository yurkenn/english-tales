/**
 * Guest Username Generator Utility
 * Generates fun, reading-themed usernames for anonymous users
 */

// Reading-themed prefixes
const PREFIXES = [
    'Curious',
    'Book',
    'Story',
    'Page',
    'Chapter',
    'Swift',
    'Avid',
    'Night',
    'Bright',
    'Wise',
    'Epic',
    'Word',
    'Tale',
    'Dream',
    'Magic',
];

// Reading-themed suffixes
const SUFFIXES = [
    'Reader',
    'Explorer',
    'Seeker',
    'Turner',
    'Lover',
    'Owl',
    'Fox',
    'Bee',
    'Star',
    'Wind',
    'Spark',
    'Hawk',
    'Wolf',
    'Bear',
    'Bird',
];

/**
 * Generate a random number suffix (4 digits)
 */
const generateNumberSuffix = (): string => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};

/**
 * Pick a random item from an array
 */
const pickRandom = <T>(arr: T[]): T => {
    return arr[Math.floor(Math.random() * arr.length)];
};

/**
 * Generate a fun, thematic username for guest users
 * Example outputs: "CuriousReader_7284", "BookExplorer_3591", "StorySeeker_8426"
 */
export const generateGuestUsername = (): string => {
    const prefix = pickRandom(PREFIXES);
    const suffix = pickRandom(SUFFIXES);
    const number = generateNumberSuffix();

    return `${prefix}${suffix}_${number}`;
};

/**
 * Generate a shorter guest username (just prefix + number)
 * Example outputs: "Reader_7284", "Explorer_3591"
 */
export const generateShortGuestUsername = (): string => {
    const suffix = pickRandom(SUFFIXES);
    const number = generateNumberSuffix();

    return `${suffix}_${number}`;
};
