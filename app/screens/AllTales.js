import { FlatList, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import CategoryCard from '../components/Category/CategoryCard';

const AllTales = ({ route }) => {
  const { data } = route.params;

  const renderItem = ({ item }) => <CategoryCard data={item} />;

  return (
    <View style={styles.container}>
      <FlatList data={data} renderItem={renderItem} />
    </View>
  );
};

export default AllTales;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
});
