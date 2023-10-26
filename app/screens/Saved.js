import React from 'react';
import { Animated, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useBookmark } from '../store/BookmarkContext';
import SavedCard from '../components/Saved/SavedCard';
import { Colors } from '../constants/colors';

const Saved = ({ navigation }) => {
  const { bookmarks, removeBookmark } = useBookmark();

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate('Detail', {
          data: item,
        })
      }
    >
      <SavedCard data={item} onDelete={removeBookmark} />
    </TouchableOpacity>
  );

  return (
    <Animated.View style={styles.container}>
      {bookmarks.length > 0 ? (
        <FlatList data={bookmarks} renderItem={renderItem} />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>You haven't saved any tales yet</Text>
        </View>
      )}
    </Animated.View>
  );
};

export default Saved;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: Colors.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
  },
});
