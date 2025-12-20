export interface DictionaryEntry {
    word: string;
    phonetic?: string;
    phonetics: {
        text: string;
        audio?: string;
    }[];
    meanings: {
        partOfSpeech: string;
        definitions: {
            definition: string;
            example?: string;
            synonyms: string[];
            antonyms: string[];
        }[];
    }[];
}

const API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en';

export const dictionaryService = {
    /**
     * Look up a word's definition and metadata.
     */
    lookup: async (word: string): Promise<DictionaryEntry | null> => {
        try {
            const cleanedWord = word.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
            const response = await fetch(`${API_URL}/${cleanedWord}`);

            if (!response.ok) {
                return null;
            }

            const data = await response.json();

            // The API returns an array, we take the first match
            if (Array.isArray(data) && data.length > 0) {
                return data[0];
            }

            return null;
        } catch (error) {
            console.error('Dictionary API Error:', error);
            return null;
        }
    },
};
