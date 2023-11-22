import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { Colors } from '../../constants/colors';
import { useNavigation } from '@react-navigation/native';
import { urlFor } from '../../../sanity';
import FormatReadTime from '../FormatReadTime';
import InfoContainer from './InfoContainer';

const WINDOW_WIDTH = Dimensions.get('window').width;
const IMAGE_WIDTH = WINDOW_WIDTH * 0.5;
const IMAGE_HEIGHT = IMAGE_WIDTH * 1.25;

const FeaturedStories = ({ data }) => {
  const navigation = useNavigation();

  const goDetailScreen = () => {
    navigation.navigate('Detail', { data });
  };

  const readTime = data.tales[0].readTime;
  const formattedReadTime = FormatReadTime(readTime);

  return (
    <TouchableOpacity onPress={goDetailScreen} activeOpacity={0.7} accessibilityRole="button">
      <View style={styles.container}>
        <Image source={{ uri: urlFor(data.imageURL).url() }} style={styles.image} />
        <Text style={styles.title}>{data.title}</Text>
        <InfoContainer readTime={formattedReadTime} likes={data.tales[0].likes} />
      </View>
    </TouchableOpacity>
  );
};

export default FeaturedStories;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark500,
    borderRadius: 10,
    marginHorizontal: 10,
    padding: 10,
  },

  imageContainer: {
    position: 'relative',
  },
  image: {
    borderRadius: 10,
    height: IMAGE_HEIGHT,
    width: IMAGE_WIDTH,
    resizeMode: 'cover',
  },
  title: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 24,
    marginTop: 10,
  },
});
