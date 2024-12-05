import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import useSearch from '../hooks/useSearch';
import LoadingAnimation from '../components/Animations/LoadingAnimation';
import ErrorAnimation from '../components/Animations/ErrorAnimation';
import CategoryCard from '../components/Category/CategoryCard';
import Icon from '../components/Icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Colors } from '../constants/colors';

const SearchScreen = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { results, loading, error } = useSearch(searchTerm);
  const [isFocused, setIsFocused] = useState(false);

  const renderEmptyState = () => (
    <Animated.View entering={FadeIn} style={styles.emptyContainer}>
      <Icon name="search" size={windowHeight * 0.1} color={Colors.gray500} />
      <Text style={styles.emptyText}>{searchTerm ? 'No results found' : 'Search for tales'}</Text>
    </Animated.View>
  );

  return (
    <LinearGradient colors={['#1F1F1F', Colors.dark900]} style={styles.container}>
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color={isFocused ? Colors.white : Colors.gray500} />
        <TextInput
          style={[styles.input, isFocused && styles.inputFocused]}
          placeholder="Search tales..."
          onChangeText={setSearchTerm}
          value={searchTerm}
          placeholderTextColor={Colors.gray500}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {searchTerm && (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <Icon name="close-outline" size={20} color={Colors.gray500} />
          </TouchableOpacity>
        )}
      </View>

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
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContainer}
        />
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark500,
    borderRadius: 12,
    padding: windowWidth * 0.03,
    marginBottom: windowHeight * 0.02,
  },
  input: {
    flex: 1,
    color: Colors.white,
    fontSize: windowHeight * 0.018,
    marginHorizontal: windowWidth * 0.02,
    padding: 0,
  },
  inputFocused: {
    color: Colors.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: windowHeight * 0.02,
  },
  emptyText: {
    color: Colors.gray500,
    fontSize: windowHeight * 0.02,
  },
  listContainer: {
    paddingBottom: windowHeight * 0.02,
  },
  cardContainer: {
    marginBottom: windowHeight * 0.02,
  },
});

export default SearchScreen;
