import { StyleSheet, View, Text } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import React, { useState } from 'react';
import useGetTalesByCategory from '../hooks/useGetTalesByCategory';
import CategoryCard from '../components/Category/CategoryCard';
import LoadingAnimation from '../components/Animations/LoadingAnimation';
import ErrorAnimation from '../components/Animations/ErrorAnimation';
import { Colors } from '../constants/colors';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { scale, verticalScale, spacing, fontSizes, wp, isSmallDevice } from '../utils/dimensions';

const CategoryList = ({ route }) => {
  const { category } = route.params;
  const { categoryList, loading, error } = useGetTalesByCategory(category);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const renderItem = ({ item, index }) => (
    <Animated.View entering={FadeInDown.delay(index * 100)} style={styles.cardWrapper}>
      <CategoryCard data={item} />
    </Animated.View>
  );

  if (loading) return <LoadingAnimation />;
  if (error) return <ErrorAnimation />;
  if (!categoryList?.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No tales found in this category</Text>
      </View>
    );
  }

  return (
    <LinearGradient colors={['#1F1F1F', Colors.dark900]} style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.resultCount}>{categoryList.length} Tales</Text>
      </View>

      <FlashList
        data={categoryList}
        estimatedItemSize={200}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  headerContainer: {
    marginBottom: verticalScale(16),
    paddingHorizontal: spacing.sm,
  },
  resultCount: {
    color: Colors.white,
    fontSize: fontSizes.md,
    fontWeight: '600',
    opacity: 0.8,
  },
  listContainer: {
    paddingBottom: verticalScale(16),
  },
  cardWrapper: {
    marginBottom: spacing.md,
    // Add additional padding for small devices
    paddingHorizontal: isSmallDevice ? spacing.xs : 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark900,
    padding: spacing.lg,
  },
  emptyText: {
    color: Colors.white,
    fontSize: fontSizes.md,
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default CategoryList;
