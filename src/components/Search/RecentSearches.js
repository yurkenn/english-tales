// src/components/Search/RecentSearches.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from '../Icons';
import { Colors } from '../../constants/colors';
import { scale, spacing, fontSizes } from '../../utils/dimensions';

const RecentSearches = ({ searches = [], onSelectSearch, onClearHistory }) => {
  if (!searches?.length) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Searches</Text>
        <TouchableOpacity onPress={onClearHistory}>
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.list}>
        {searches.map((search, index) => (
          <TouchableOpacity key={index} style={styles.item} onPress={() => onSelectSearch(search)}>
            <Icon name="time-outline" size={16} color={Colors.gray500} />
            <Text style={styles.searchText}>{search}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    color: Colors.white,
    fontSize: fontSizes.lg,
    fontWeight: '600',
  },
  clearText: {
    color: Colors.primary,
    fontSize: fontSizes.sm,
  },
  list: {
    gap: spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: Colors.dark800,
    borderRadius: scale(8),
    gap: spacing.xs,
  },
  searchText: {
    color: Colors.gray300,
    fontSize: fontSizes.sm,
  },
});

export default RecentSearches;
