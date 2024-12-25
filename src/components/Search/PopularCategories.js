//src/components/Search/PopularCategories.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../Icons';
import { Colors } from '../../constants/colors';
import { scale, spacing, fontSizes, wp } from '../../utils/dimensions';

const PopularCategories = ({ categories = [], onSelectCategory }) => {
  // categories boşsa null döndür
  if (!categories?.length) return null;

  const popularCategories = categories.slice(0, 6);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Popular Categories</Text>
      <View style={styles.grid}>
        {popularCategories.map((category) => (
          <TouchableOpacity
            key={category?._id || Math.random().toString()}
            onPress={() => onSelectCategory?.(category)}
            style={styles.categoryButton}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={[category?.color || '#1F1F1F', Colors.dark900]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.categoryGradient}
            >
              <Icon name={category?.iconName || 'book'} size={scale(24)} color={Colors.white} />
              <Text style={styles.categoryName} numberOfLines={2}>
                {category?.title || 'Category'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  categoryButton: {
    margin: spacing.xs,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: scale(2),
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  categoryGradient: {
    width: wp(22),
    height: wp(22),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scale(12),
    padding: spacing.sm,
    gap: spacing.xs,
  },
  categoryName: {
    color: Colors.white,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});

export default PopularCategories;
