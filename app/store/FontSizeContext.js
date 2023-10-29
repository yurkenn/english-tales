import { createContext, useState, useContext } from 'react';

const FontSizeContext = createContext();

export const FontSizeProvider = ({ children }) => {
  const [fontSize, setFontSize] = useState(16); // Initial font size

  const changeFontSize = (newSize) => {
    setFontSize(newSize);
  };

  return (
    <FontSizeContext.Provider value={{ fontSize, changeFontSize }}>
      {children}
    </FontSizeContext.Provider>
  );
};

export const useFontSize = () => {
  return useContext(FontSizeContext);
};
