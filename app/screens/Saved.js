import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useBookmark } from '../store/BookmarkContext';
import SavedCard from '../components/Saved/SavedCard';
import { Colors } from '../constants/colors';

const Saved = ({ navigation }) => {
  const { bookmarks, removeBookmark } = useBookmark();

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('Detail', { data: item })}
      activeOpacity={0.5} // Visual feedback on press
      accessibilityLabel="Tap to view this saved tale"
    >
      <SavedCard data={item} onDelete={removeBookmark} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {bookmarks.length > 0 ? (
        <FlashList
          data={bookmarks}
          estimatedItemSize={200}
          renderItem={renderItem}
          keyExtractor={(item, index) => `bookmark-${index}`}
          // Unique key for each item
        />
      ) : (
        <View style={styles.emptyContainer}>
          {/* Consider adding an image here for a better empty state */}
          <Text style={styles.emptyText}>You haven't saved any tales yet.</Text>
        </View>
      )}
    </View>
  );
};
export default Saved;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: Colors.dark900,
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
    color: Colors.gray,
  },
});
