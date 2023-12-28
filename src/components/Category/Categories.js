import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../../constants/colors';
import { Image } from 'react-native';

const Categories = ({ data }) => {
  const navigation = useNavigation();
  const handleCategories = () => {
    navigation.navigate('CategoryList', { category: data?.title });
  };

  return (
    <View style={styles.buttonContainer}>
      <TouchableOpacity onPress={handleCategories} style={styles.button}>
        <Image source={{ uri: data?.icon }} style={{ height: 24, width: 24 }} />
        <Text style={styles.categoryName}>{data?.title}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Categories;

const { width } = Dimensions.get('window');

const buttonSize = width < 400 ? 83 : 90;
const fontSize = width < 400 ? 10 : 12;

const styles = StyleSheet.create({
  buttonContainer: {
    marginHorizontal: 10,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    width: buttonSize,
    height: buttonSize,
    backgroundColor: Colors.dark500,
    borderRadius: 6,
  },
  categoryName: {
    color: Colors.white,
    fontSize: fontSize,
    lineHeight: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 10,
  },
});
