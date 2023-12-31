import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useBookmark } from '../store/BookmarkContext';
import SavedCard from '../components/Saved/SavedCard';
import { Colors } from '../constants/colors';
import { FlatList } from 'react-native-gesture-handler';

const Saved = ({ navigation }) => {
  const { bookmarks, removeBookmark } = useBookmark();

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('Detail', { data: item })}
      activeOpacity={0.8}
    >
      <SavedCard data={item} onDelete={removeBookmark} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {bookmarks.length > 0 ? (
        <FlatList data={bookmarks} renderItem={renderItem} key={bookmarks.slug} />
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

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: width * 0.025, // 2.5% of screen width
    backgroundColor: Colors.dark900,
  },
  title: {
    fontSize: width < 400 ? 22 : 24, // smaller font size for smaller screens
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
    fontSize: width < 400 ? 16 : 18, // smaller font size for smaller screens
    color: Colors.gray,
  },
});
