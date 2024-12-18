import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/colors';
import { FlashList } from '@shopify/flash-list';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../components/Icons';
import { wp, hp, moderateScale, fontSizes, spacing, layout } from '../utils/dimensions';
import { useDispatch, useSelector } from 'react-redux';
import { loadBookmarks, removeBookmark } from '../store/slices/bookmarkSlice';
import SavedCard from '../components/Saved/SavedCard';

const EmptyState = () => (
  <Animated.View entering={FadeInDown.springify()} style={styles.emptyContainer}>
    <Icon name="bookmark-outline" size={moderateScale(48)} color={Colors.gray500} />
    <Text style={styles.emptyTitle}>No saved tales yet</Text>
    <Text style={styles.emptySubtitle}>Your bookmarked tales will appear here</Text>
  </Animated.View>
);

const Saved = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { bookmarks } = useSelector((state) => state.bookmarks);

  useEffect(() => {
    if (user?.uid) {
      dispatch(loadBookmarks(user.uid));
    }
  }, [user]);

  const handleRemoveBookmark = (bookData) => {
    dispatch(removeBookmark({ bookData, userId: user.uid }));
  };

  const renderItem = ({ item, index }) => (
    <Animated.View entering={FadeInDown.delay(index * 100)}>
      <TouchableOpacity
        onPress={() => navigation.navigate('Detail', { data: item })}
        activeOpacity={0.7}
      >
        <SavedCard data={item} onDelete={handleRemoveBookmark} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  listContainer: {
    paddingBottom: hp(2),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: hp(2),
  },
  emptyTitle: {
    fontSize: fontSizes.xl,
    fontWeight: '600',
    color: Colors.white,
  },
  emptySubtitle: {
    fontSize: fontSizes.sm,
    color: Colors.gray500,
  },
});

export default Saved;
