import React from 'react';
import Navigation from './app/navigation';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './app/store/AuthContext';
import BookmarkProvider from './app/store/BookmarkContext';
import 'react-native-url-polyfill/auto';

const App = () => {
  return (
    <>
      <StatusBar style="light" />
      <AuthProvider>
        <BookmarkProvider>
          <Navigation />
        </BookmarkProvider>
      </AuthProvider>
    </>
  );
};

export default App;
