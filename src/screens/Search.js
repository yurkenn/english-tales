import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSharedValue, withSpring } from 'react-native-reanimated';
import { Colors } from '../constants/colors';
import { spacing } from '../utils/dimensions';

// Components
import SearchHeader from '../components/Search/SearchHeader';
import RecentSearches from '../components/Search/RecentSearches';
import CategoryCard from '../components/Category/CategoryCard';
import EmptyState from '../components/Search/EmptyState';

// Hooks
import useGetCategories from '../hooks/useGetCategories';
import useSearch from '../hooks/useSearch';
import useGetTalesByCategory from '../hooks/useGetTalesByCategory';

import PopularCategories from '../components/Search/PopularCategories';
import LoadingScreen from '../components/LoadingScreen';

const RECENT_SEARCHES_KEY = '@recent_searches';
const MAX_RECENT_SEARCHES = 5;

const SearchScreen = () => {
  const [isFocused, setIsFocused] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);
  const inputScale = useSharedValue(1);

  const { categories = [], loading: categoriesLoading } = useGetCategories();
  const {
    searchTerm,
    setSearchTerm,
    clearSearch,
    results: searchResults = [],
    loading: searchLoading,
  } = useSearch();

  const { categoryList = [], loading: categoryLoading } = useGetTalesByCategory(
    selectedCategory?.title
  );

  const loading = searchLoading || categoryLoading;
  const results = useMemo(() => {
    if (selectedCategory) {
      return categoryList || [];
    }
    return searchResults || [];
  }, [selectedCategory, categoryList, searchResults]);

  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      const searches = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (searches) {
        setRecentSearches(JSON.parse(searches));
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  const saveRecentSearch = async (search) => {
    if (!search?.trim()) return;

    try {
      let searches = [...recentSearches];
      searches = searches.filter((item) => item !== search);
      searches.unshift(search);
      searches = searches.slice(0, MAX_RECENT_SEARCHES);

      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
      setRecentSearches(searches);
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  };

  const handleTextChange = useCallback(
    (text) => {
      setSearchTerm(text);
      if (text?.trim()) {
        saveRecentSearch(text);
        setSelectedCategory(null);
      }
    },
    [setSearchTerm]
  );

  const clearSearchHistory = async () => {
    try {
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
      setRecentSearches([]);
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  };

  const handleClear = useCallback(() => {
    clearSearch();
    setSelectedCategory(null);
  }, [clearSearch]);

  const handleFocus = () => {
    setIsFocused(true);
    inputScale.value = withSpring(1.02);
  };

  const handleBlur = () => {
    setIsFocused(false);
    inputScale.value = withSpring(1);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setSearchTerm('');
  };

  return (
    <View style={styles.container}>
      <SearchHeader
        searchTerm={searchTerm}
        isFocused={isFocused}
        inputScale={inputScale}
        onChangeText={handleTextChange}
        onClear={handleClear}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />

      <View style={styles.content}>
        {!searchTerm && !loading && (
          <RecentSearches
            searches={recentSearches}
            onSelectSearch={setSearchTerm}
            onClearHistory={clearSearchHistory}
          />
        )}

        {loading ? (
          <LoadingScreen />
        ) : (
          <>
            {results.length > 0 ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.resultsContainer}>
                  {results.map((item, index) => (
                    <Animated.View
                      key={item?._id || Math.random().toString()}
                      entering={FadeInDown.delay(index * 100)}
                      style={styles.cardContainer}
                    >
                      <CategoryCard data={item} />
                    </Animated.View>
                  ))}
                </View>

                <PopularCategories
                  categories={categories}
                  onSelectCategory={handleCategorySelect}
                />
                <View style={styles.bottomPadding} />
              </ScrollView>
            ) : (
              <EmptyState
                searchTerm={searchTerm}
                categories={categories}
                loading={categoriesLoading}
                onSelectSearch={setSearchTerm}
                onSelectCategory={handleCategorySelect}
              />
            )}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark900,
  },
  content: {
    flex: 1,
  },
  resultsContainer: {
    padding: spacing.lg,
  },
  cardContainer: {
    marginBottom: spacing.md,
  },
  bottomPadding: {
    height: spacing.xl * 2,
  },
});

export default SearchScreen;
