import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
              uri: data?.imageURL,
            }}
          />
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{data?.title}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default CategoryCard;

const { width } = Dimensions.get('window');

const imageSize = width < 400 ? { width: 40, height: 60 } : { width: 50, height: 70 };
const titleFontSize = width < 400 ? 14 : 16;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginVertical: 5,
    backgroundColor: Colors.dark500,
    borderRadius: 5,
    elevation: 2,
  },
  imageContainer: {
    marginRight: 10,
  },
  image: {
    ...imageSize,
    borderRadius: 5,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: titleFontSize,
    fontWeight: 'bold',
    color: Colors.white,
  },
  author: {
    fontSize: 14,
    color: Colors.white,
  },
});
