//src/components/Search/PopularCategories.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../Icons';
import { Colors } from '../../constants/colors';
import { scale, spacing, fontSizes, wp } from '../../utils/dimensions';

const PopularCategories = ({ categories = [], onSelectCategory }) => {
  if (!categories?.length) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Popular Categories</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category?._id || Math.random().toString()}
            onPress={() => onSelectCategory?.(category)}
            style={styles.categoryButton}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[Colors.dark800, Colors.dark900]}
              style={styles.categoryGradient}
            >
              <Icon name={category?.iconName || 'book'} size={16} color={Colors.primary} />
              <Text style={styles.categoryName} numberOfLines={1}>
                {category?.title || 'Category'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.lg,
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  categoryButton: {
    marginRight: spacing.sm,
    width: wp(32), // Fixed width for all categories (approximately 32% of screen width)
  },
  categoryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: scale(8),
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: Colors.dark700 + '20',
    minHeight: scale(44), // Fixed height for all categories
  },
  categoryName: {
    color: Colors.white,
    fontSize: fontSizes.sm,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default PopularCategories;
