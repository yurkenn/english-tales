import { StyleSheet, View } from 'react-native';
import React from 'react';
import CategoryCard from '../components/Category/CategoryCard';
import { FlashList } from '@shopify/flash-list';

const AllTales = ({ route }) => {
  const { data } = route.params;

  const renderItem = ({ item }) => <CategoryCard data={item} />;

  return (
    <View style={styles.container}>
      <FlashList data={data} renderItem={renderItem} estimatedItemSize={200} />
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
