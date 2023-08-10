import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { AdventureIcon } from '../../UI/SvgIcons';

const Categories = ({ data }) => {
  return (
    <View style={styles.buttonContainer}>
      <TouchableOpacity style={styles.button}>
        <AdventureIcon />
        <Text style={styles.categoryName}>{data.title}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Categories;

const styles = StyleSheet.create({
  buttonContainer: {
    marginHorizontal: 10,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    width: 88,
    height: 88,
    backgroundColor: '#282828',
    borderRadius: 6,
  },
  categoryName: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 10,
  },
});
