// src/store/BookmarkContext.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';

const BookmarkContext = createContext();

const BookmarkProvider = ({ children }) => {
  const [bookmarks, setBookmarks] = useState([]);
  const { userInfo } = useContext(AuthContext);

  useEffect(() => {
    if (userInfo?.uid) {
      loadBookmarks(userInfo.uid);
    } else {
      setBookmarks([]); // Clear bookmarks when no user is logged in
    }
  }, [userInfo]); // Reload bookmarks when user changes

  const loadBookmarks = async (userId) => {
    try {
      const storedBookmarks = await AsyncStorage.getItem(`bookmarks_${userId}`);
      if (storedBookmarks) {
        setBookmarks(JSON.parse(storedBookmarks));
      } else {
        setBookmarks([]);
      }
    } catch (error) {
      console.error('Error loading bookmarks from AsyncStorage:', error);
    }
  };

  const toggleBookmark = async (bookData) => {
    if (!userInfo?.uid) return;

    const existingBookmark = bookmarks.find(
      (bookmark) => bookmark.slug.current === bookData.slug.current
    );

    if (existingBookmark) {
      // Remove the bookmark
      const updatedBookmarks = bookmarks.filter(
        (bookmark) => bookmark.slug.current !== bookData.slug.current
      );
      setBookmarks(updatedBookmarks);
      await AsyncStorage.setItem(`bookmarks_${userInfo.uid}`, JSON.stringify(updatedBookmarks));
    } else {
      // Add the bookmark
      const updatedBookmarks = [...bookmarks, bookData];
      setBookmarks(updatedBookmarks);
      await AsyncStorage.setItem(`bookmarks_${userInfo.uid}`, JSON.stringify(updatedBookmarks));
    }
  };

  const removeBookmark = async (bookData) => {
    if (!userInfo?.uid) return;

    const existingBookmark = bookmarks.find(
      (bookmark) => bookmark.slug.current === bookData.slug.current
    );

    if (existingBookmark) {
      // Remove the bookmark
      const updatedBookmarks = bookmarks.filter(
        (bookmark) => bookmark.slug.current !== bookData.slug.current
      );
      setBookmarks(updatedBookmarks);
      await AsyncStorage.setItem(`bookmarks_${userInfo.uid}`, JSON.stringify(updatedBookmarks));
    }
  };

  return (
    <BookmarkContext.Provider value={{ bookmarks, toggleBookmark, setBookmarks, removeBookmark }}>
      {children}
    </BookmarkContext.Provider>
  );
};

export const useBookmark = () => {
  return useContext(BookmarkContext);
};

export default BookmarkProvider;
