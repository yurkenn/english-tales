import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import Navigation from './app/navigation';
import { StatusBar } from 'expo-status-bar';

const App = () => {
  return (
    <>
      <Navigation />
      <StatusBar style="auto" />
    </>
  );
};

export default App;
