import React, { useState } from 'react';
import { View, TextInput, FlatList, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import useSearch from '../hooks/useSearch';
import LoadingAnimation from '../components/Animations/LoadingAnimation';
import ErrorAnimation from '../components/Animations/ErrorAnimation';
import CategoryCard from '../components/Category/CategoryCard';
import Icon from '../components/Icons';

const SearchScreen = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { results, loading, error } = useSearch(searchTerm);

  if (loading) {
    return <LoadingAnimation />;
  }

  if (error) {
    return <ErrorAnimation />;
  }

  const renderItem = ({ item }) => <CategoryCard data={item} />;

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search for a tale"
        onChangeText={(text) => setSearchTerm(text)}
        placeholderTextColor={'#ccc'}
        value={searchTerm}
      />
      {results.length > 0 ? (
        <FlatList data={results} renderItem={renderItem} />
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', opacity: 0.5 }}>
          <Icon name="search" size={100} color="#ccc" />
          <Text style={{ fontSize: 20, color: '#ccc' }}>No results found</Text>
        </View>
      )}
    </View>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    color: 'white',
  },
});
