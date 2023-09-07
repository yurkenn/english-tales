import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { PlanetOutlineIcon } from '../../UI/Icons';

const Categories = ({ data }) => {
  const navigation = useNavigation();
  const handleCategories = () => {
    navigation.navigate('CategoryList', { category: data.title });
  };

  return (
    <View style={styles.buttonContainer}>
      <TouchableOpacity onPress={handleCategories} style={styles.button}>
        <PlanetOutlineIcon />
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
