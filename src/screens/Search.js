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

const EmptyState = ({ searchTerm }) => (
  <Animated.View entering={FadeIn} style={styles.emptyContainer}>
    <LinearGradient colors={['#282828', '#161616']} style={styles.emptyCard}>
      <Icon name="search" size={windowHeight * 0.08} color={Colors.primary} />
      <Text style={styles.emptyTitle}>{searchTerm ? 'No results found' : 'Search for tales'}</Text>
      <Text style={styles.emptySubtitle}>
        {searchTerm
          ? 'Try different keywords or check spelling'
          : 'Discover amazing stories in our collection'}
      </Text>
    </LinearGradient>
  </Animated.View>
);

const SearchScreen = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { results, loading, error } = useSearch(searchTerm);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#282828', '#161616']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color={isFocused ? Colors.primary : Colors.gray500} />
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
            <TouchableOpacity onPress={() => setSearchTerm('')} style={styles.clearButton}>
              <Icon name="close-circle" size={20} color={Colors.gray500} />
            </TouchableOpacity>
          )}
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

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark900,
  },
  header: {
    padding: windowWidth * 0.04,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark900 + '80',
    borderRadius: 12,
    padding: windowWidth * 0.03,
    borderWidth: 1,
    borderColor: Colors.dark700,
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
  clearButton: {
    padding: 4,
  },
  listContainer: {
    padding: windowWidth * 0.04,
  },
  cardContainer: {
    marginBottom: windowHeight * 0.02,
  },
  emptyContainer: {
    flex: 1,
    padding: windowWidth * 0.04,
  },
  emptyCard: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: windowHeight * 0.04,
    borderRadius: 16,
    gap: windowHeight * 0.02,
  },
  emptyTitle: {
    color: Colors.white,
    fontSize: windowHeight * 0.024,
    fontWeight: '600',
  },
  emptySubtitle: {
    color: Colors.gray500,
    fontSize: windowHeight * 0.016,
    textAlign: 'center',
  },
});

export default SearchScreen;
