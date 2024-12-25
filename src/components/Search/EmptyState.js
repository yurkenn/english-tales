import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../Icons';
import { Colors } from '../../constants/colors';
import { scale, spacing, fontSizes } from '../../utils/dimensions';
import PopularCategories from './PopularCategories';
import SuggestedSearches from './SuggestedSearches';

const EmptyState = ({ searchTerm, categories, loading, onSelectSearch, onSelectCategory }) => {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Icon name="refresh" size={32} color={Colors.primary} />
      </View>
    );
  }

  if (searchTerm) {
    return (
      <Animated.View entering={FadeIn} style={styles.container}>
        <LinearGradient colors={['#282828', '#161616']} style={styles.content}>
          <Icon name="search" size={48} color={Colors.primary} />
          <Text style={styles.title}>No results found</Text>
          <Text style={styles.subtitle}>Try different keywords or check spelling</Text>
        </LinearGradient>
      </Animated.View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {categories && categories.length > 0 && (
        <PopularCategories categories={categories} onSelectCategory={onSelectCategory} />
      )}
      <SuggestedSearches onSelectSearch={onSelectSearch} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  content: {
    padding: spacing.xl,
    borderRadius: scale(20),
    alignItems: 'center',
    gap: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: '600',
    color: Colors.white,
  },
  subtitle: {
    fontSize: fontSizes.sm,
    color: Colors.gray300,
    textAlign: 'center',
  },
});

export default EmptyState;
