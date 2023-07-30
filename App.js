import React from 'react';
import Navigation from './app/navigation';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './app/store/auth-context';

const App = () => {
  return (
    <>
      <StatusBar style="light" />
      <AuthProvider>
        <Navigation />
      </AuthProvider>
    </>
  );
};

export default App;
