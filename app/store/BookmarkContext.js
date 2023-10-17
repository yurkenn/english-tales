import React, { createContext, useContext, useState, useEffect } from 'react';

const BookmarkContext = createContext();

const BookmarkProvider = ({ children }) => {
  const [bookmarks, setBookmarks] = useState([]);

  const toggleBookmark = (bookId) => {
    if (bookmarks.includes(bookId)) {
      // If the bookId is already in the bookmarks array, remove it.
      const updatedBookmarks = bookmarks.filter((id) => id !== bookId);
      setBookmarks(updatedBookmarks);
    } else {
      // If the bookId is not in the bookmarks array, add it.
      const updatedBookmarks = [...bookmarks, bookId];
      setBookmarks(updatedBookmarks);
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
