import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useBookmark } from '../store/BookmarkContext';
import SavedCard from '../components/Saved/SavedCard';
import { Colors } from '../constants/colors';
import { FlashList } from '@shopify/flash-list';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../components/Icons';

const EmptyState = () => (
  <Animated.View entering={FadeInDown.springify()} style={styles.emptyContainer}>
    <Icon name="bookmark-outline" size={windowHeight * 0.1} color={Colors.gray} />
    <Text style={styles.emptyTitle}>No saved tales yet</Text>
    <Text style={styles.emptySubtitle}>Your bookmarked tales will appear here</Text>
  </Animated.View>
);

const Saved = ({ navigation }) => {
  const { bookmarks, removeBookmark } = useBookmark();

  const renderItem = ({ item, index }) => (
    <Animated.View entering={FadeInDown.delay(index * 100)}>
      <TouchableOpacity
        onPress={() => navigation.navigate('Detail', { data: item })}
        activeOpacity={0.7}
      >
        <SavedCard data={item} onDelete={removeBookmark} />
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <LinearGradient colors={['#1F1F1F', Colors.dark900]} style={styles.container}>
      {bookmarks.length > 0 ? (
        <FlashList
          data={bookmarks}
          renderItem={renderItem}
          estimatedItemSize={150}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <EmptyState />
      )}
    </LinearGradient>
  );
};

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: windowWidth * 0.04,
  },
  listContainer: {
    paddingBottom: windowHeight * 0.02,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: windowHeight * 0.02,
  },
  emptyTitle: {
    fontSize: windowHeight * 0.024,
    fontWeight: '600',
    color: Colors.white,
  },
  emptySubtitle: {
    fontSize: windowHeight * 0.016,
    color: Colors.gray,
  },
});

export default Saved;
