import React, { useState, useCallback } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import useSearch from '../hooks/useSearch';
import LoadingAnimation from '../components/Animations/LoadingAnimation';
import ErrorAnimation from '../components/Animations/ErrorAnimation';
import CategoryCard from '../components/Category/CategoryCard';
import Icon from '../components/Icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Colors } from '../constants/colors';
import { wp, hp, moderateScale, fontSizes, spacing, layout } from '../utils/dimensions';

const EmptyState = ({ searchTerm }) => (
  <Animated.View entering={FadeIn} style={styles.emptyContainer}>
    <LinearGradient colors={['#282828', '#161616']} style={styles.emptyCard}>
      <Icon name="search" size={moderateScale(48)} color={Colors.primary} />
      <Text style={styles.emptyTitle}>{searchTerm ? 'No results found' : 'Search for tales'}</Text>
      <Text style={styles.emptySubtitle}>
        {searchTerm
          ? 'Try different keywords or check spelling'
          : 'Discover amazing tales in our collection'}
      </Text>
    </LinearGradient>
  </Animated.View>
);

const SearchScreen = () => {
  const [isFocused, setIsFocused] = useState(false);
  const { searchTerm, setSearchTerm, clearSearch, results, loading, error } = useSearch();

  const handleTextChange = useCallback(
    (text) => {
      setSearchTerm(text);
    },
    [setSearchTerm]
  );

  const handleClear = useCallback(() => {
    clearSearch();
  }, [clearSearch]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#282828', '#161616']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.searchContainer}>
          <Icon
            name="search"
            size={moderateScale(20)}
            color={isFocused ? Colors.primary : Colors.gray500}
          />
          <TextInput
            style={[styles.input, isFocused && styles.inputFocused]}
            placeholder="Search tales..."
            onChangeText={handleTextChange}
            value={searchTerm}
            placeholderTextColor={Colors.gray500}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          {searchTerm ? (
            <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
              <Icon name="close-circle" size={moderateScale(20)} color={Colors.gray500} />
            </TouchableOpacity>
          ) : null}
        </View>
      </LinearGradient>

      {loading ? (
        <LoadingAnimation />
      ) : error ? (
        <ErrorAnimation />
      ) : (
        <FlashList
          data={results}
          estimatedItemSize={200}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeIn.delay(index * 100)} style={styles.cardContainer}>
              <CategoryCard data={item} />
            </Animated.View>
          )}
          ListEmptyComponent={() => <EmptyState searchTerm={searchTerm} />}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark900,
  },
  header: {
    padding: spacing.md,
    borderBottomLeftRadius: layout.borderRadius * 2.5,
    borderBottomRightRadius: layout.borderRadius * 2.5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark900 + '80',
    borderRadius: layout.borderRadius,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: Colors.dark700,
  },
  input: {
    flex: 1,
    color: Colors.white,
    fontSize: fontSizes.md,
    marginHorizontal: spacing.sm,
    padding: 0,
  },
  inputFocused: {
    color: Colors.white,
  },
  clearButton: {
    padding: spacing.xs,
  },
  listContainer: {
    padding: spacing.md,
  },
  cardContainer: {
    marginBottom: hp(2),
  },
  emptyContainer: {
    flex: 1,
    padding: spacing.md,
  },
  emptyCard: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: layout.borderRadius * 2,
    gap: hp(2),
  },
  emptyTitle: {
    color: Colors.white,
    fontSize: fontSizes.xl,
    fontWeight: '600',
  },
  emptySubtitle: {
    color: Colors.gray500,
    fontSize: fontSizes.sm,
    textAlign: 'center',
  },
});

export default SearchScreen;
