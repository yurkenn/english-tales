import React from 'react';
import Navigation from './app/navigation';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './app/store/AuthContext';
import BookmarkProvider from './app/store/BookmarkContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-url-polyfill/auto';
import { FontSizeProvider } from './app/store/FontSizeContext';
import Toast from 'react-native-toast-message';

const App = () => {
  return (
    <>
      <StatusBar style="light" />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <FontSizeProvider>
            <BookmarkProvider>
              <Navigation />
            </BookmarkProvider>
          </FontSizeProvider>
        </AuthProvider>
      </GestureHandlerRootView>
      <Toast />
    </>
  );
};

export default App;
