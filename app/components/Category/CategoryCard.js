import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { Colors } from '../../constants/colors';
import { useNavigation } from '@react-navigation/native';

const CategoryCard = ({ data }) => {
  const navigation = useNavigation();

  const handleNavigation = () => {
    navigation.navigate('Content', { slug: data.slug.current });
  };

  return (
    <TouchableOpacity onPress={handleNavigation}>
      <View style={styles.container}>
        <View style={styles.imageContainer}>
          <Image
            style={styles.image}
            source={{
              uri: data.imageURL,
            }}
          />
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{data.title}</Text>
          <Text style={styles.author}>Written by {data.author}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default CategoryCard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark500,
    borderRadius: 10,
  },
  imageContainer: {
    flex: 1,
    padding: 10,
  },
  image: {
    flex: 1,
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  titleContainer: {
    flex: 2,
    padding: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
  },
  author: {
    fontSize: 16,
    color: Colors.white,
  },
});
