import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
export const HomeIcon = () => {
  return <MaterialIcons name="home" size={23} color="white" />;
};

export const SearchIcon = () => {
  return <Ionicons name="md-search-sharp" size={23} color="white" />;
};

export const ListenIcon = () => {
  return <Ionicons name="play-circle" size={23} color="white" />;
};

export const SavedIcon = () => {
  return <Ionicons name="ios-bookmark" size={24} color="white" />;
};

export const ProfileIcon = () => {
  return <Ionicons name="person" size={23} color="white" />;
};
