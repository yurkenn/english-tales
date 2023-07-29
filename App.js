import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import Navigation from './app/navigation';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './app/store/auth-context';

const App = () => {
  return (
    <>
      <StatusBar style="auto" />
      <AuthProvider>
        <Navigation />
      </AuthProvider>
    </>
  );
};

export default App;
