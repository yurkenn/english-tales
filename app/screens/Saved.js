import React from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { useBookmark } from '../store/BookmarkContext';
import SavedCard from '../components/Saved/SavedCard';

const Saved = () => {
  const { bookmarks } = useBookmark();

  const renderItem = ({ item }) => <SavedCard data={item} />;

  return (
    <View>
      <Text>Saved</Text>
      <FlatList data={bookmarks} renderItem={renderItem} />
    </View>
  );
};

export default Saved;

const styles = StyleSheet.create({});
