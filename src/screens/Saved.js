import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, RefreshControl } from 'react-native';
import { Colors } from '../constants/colors';
import { FlashList } from '@shopify/flash-list';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../components/Icons';
import { wp, hp, moderateScale, fontSizes, spacing } from '../utils/dimensions';
import { useDispatch, useSelector } from 'react-redux';
import { loadBookmarks, removeBookmark } from '../store/slices/bookmarkSlice';
import SavedCard from '../components/Saved/SavedCard';
import LoadingScreen from '../components/LoadingScreen';

const EmptyState = () => (
  <Animated.View entering={FadeInDown.springify()} style={styles.emptyContainer}>
    <LinearGradient colors={['#2A2D3A', '#1F222E']} style={styles.emptyContent}>
      <Icon name="bookmark-outline" size={moderateScale(48)} color={Colors.primary} />
      <Text style={styles.emptyTitle}>No saved tales yet</Text>
      <Text style={styles.emptySubtitle}>
        Your reading journey starts here. Save stories to read them anytime, even offline.
      </Text>
    </LinearGradient>
  </Animated.View>
);

const Saved = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { bookmarks, loading } = useSelector((state) => state.bookmarks);

  useEffect(() => {
    if (user?.uid) {
      dispatch(loadBookmarks(user.uid));
    }
  }, [user]);

  const handleRemoveBookmark = (item) => {
    dispatch(removeBookmark({ bookData: item, userId: user.uid }));
  };

  if (loading) {
    return <LoadingScreen />;
  }

  const renderItem = ({ item, index }) => (
    <SavedCard
      data={item}
      onDelete={handleRemoveBookmark}
      onPress={() => navigation.navigate('Detail', { data: item })}
      index={index}
    />
  );

  return (
    <View style={styles.container}>
      {bookmarks.length > 0 ? (
        <FlashList
          data={bookmarks}
          renderItem={renderItem}
          estimatedItemSize={200}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <EmptyState />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark900,
  },
  listContainer: {
    padding: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    padding: spacing.lg,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
    borderRadius: moderateScale(24),
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSizes.xl,
    fontWeight: '600',
    color: Colors.white,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: fontSizes.sm,
    color: Colors.gray500,
    textAlign: 'center',
    lineHeight: fontSizes.lg,
    paddingHorizontal: spacing.lg,
  },
});

export default Saved;
