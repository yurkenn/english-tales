import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useState, useEffect } from 'react';

const BookmarkContext = createContext();

const BookmarkProvider = ({ children }) => {
  // Initialize bookmarks from AsyncStorage when the context is created.
  const [bookmarks, setBookmarks] = useState([]);

  // Function to clear all data in AsyncStorage
  const clearAllData = async () => {
    try {
      await AsyncStorage.clear();
      console.log('AsyncStorage data cleared successfully');
    } catch (error) {
      console.error('Error clearing AsyncStorage data:', error);
    }
  };

  // Call the function to clear data
  //clearAllData();

  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        const storedBookmarks = await AsyncStorage.getItem('@bookmark');
        if (storedBookmarks) {
          setBookmarks(JSON.parse(storedBookmarks));
        }
      } catch (error) {
        console.error('Error loading bookmarks from AsyncStorage:', error);
      }
    };

    loadBookmarks();
  }, []); // Only runs once when the component is created.

  const toggleBookmark = async (bookData) => {
    const existingBookmark = bookmarks.find(
      (bookmark) => bookmark.tales[0].slug.current === bookData.tales[0].slug.current
    );

    if (existingBookmark) {
      // Remove the bookmark
      const updatedBookmarks = bookmarks.filter(
        (bookmark) => bookmark.tales[0].slug.current !== bookData.tales[0].slug.current
      );
      setBookmarks(updatedBookmarks);
      await AsyncStorage.setItem('@bookmark', JSON.stringify(updatedBookmarks));
    } else {
      // Add the bookmark
      const updatedBookmarks = [...bookmarks, bookData];
      setBookmarks(updatedBookmarks);
      await AsyncStorage.setItem('@bookmark', JSON.stringify(updatedBookmarks));
    }
  };

  return (
    <BookmarkContext.Provider value={{ bookmarks, toggleBookmark }}>
      {children}
    </BookmarkContext.Provider>
  );
};

export const useBookmark = () => {
  return useContext(BookmarkContext);
};

export default BookmarkProvider;
