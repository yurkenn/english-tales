// src/components/Search/SuggestedSearches.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from '../Icons';
import { Colors } from '../../constants/colors';
import { scale, spacing, fontSizes } from '../../utils/dimensions';

const SUGGESTED_SEARCHES = ['Adventure Stories', 'Fantasy Tales', 'Mystery Books', 'Folk Stories'];

const SuggestedSearches = ({ onSelectSearch }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Suggested Searches</Text>
      <View style={styles.suggestedSearches}>
        {SUGGESTED_SEARCHES.map((suggestion, index) => (
          <TouchableOpacity
            key={index}
            style={styles.suggestionChip}
            onPress={() => onSelectSearch(suggestion)}
          >
            <Icon name="search" size={16} color={Colors.primary} />
            <Text style={styles.suggestionText}>{suggestion}</Text>
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
  suggestedSearches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '20',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: scale(20),
    gap: spacing.xs,
  },
  suggestionText: {
    color: Colors.primary,
    fontSize: fontSizes.sm,
    fontWeight: '500',
  },
});

export default SuggestedSearches;
