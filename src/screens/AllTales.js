import { StyleSheet, View } from 'react-native';
import React from 'react';
import CategoryCard from '../components/Category/CategoryCard';
import { FlashList } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import { scale, spacing, wp, isSmallDevice } from '../utils/dimensions';

const AllTales = ({ route }) => {
  const { data } = route.params;

  const renderItem = ({ item, index }) => <CategoryCard data={item} index={index} />;

  return (
    <LinearGradient colors={[Colors.dark500, Colors.dark900]} style={styles.container}>
      <FlashList
        data={data}
        renderItem={renderItem}
        estimatedItemSize={200}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark900,
  },
  listContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
});

export default AllTales;
