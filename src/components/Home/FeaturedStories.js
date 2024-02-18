import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { Colors } from '../../constants/colors';
import { urlFor } from '../../../sanity';
import FormatReadTime from '../FormatReadTime';
import InfoContainer from './InfoContainer';

import Animated from 'react-native-reanimated';

const FeaturedStories = ({ data, navigation }) => {
  const goDetailScreen = () => {
    if (data && data?.tales && data.tales.length > 0) {
      navigation.navigate('Detail', { data: data?.tales[0] });
    }
  };

  const readTime = data?.tales[0].readTime;
  const formattedReadTime = FormatReadTime(readTime);

  return (
    <TouchableOpacity onPress={goDetailScreen} activeOpacity={0.7} accessibilityRole="button">
      <View style={styles.container}>
        <Animated.Image source={{ uri: urlFor(data?.imageURL).url() }} style={styles.image} />
        <Text style={styles.title}>{data?.title}</Text>
        <InfoContainer readTime={formattedReadTime} likes={data?.tales[0].likes} />
      </View>
    </TouchableOpacity>
  );
};

export default FeaturedStories;

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark500,
    borderRadius: 10,
    marginHorizontal: width * 0.02,
    padding: width * 0.03,
  },
  image: {
    borderRadius: 10,
    height: width * 0.6, // Adjust height based on screen width
    width: width * 0.45, // Adjust width based on screen width
    resizeMode: 'cover',
  },
  title: {
    color: Colors.white,
    fontSize: width * 0.036,
    fontWeight: 'bold',
    marginTop: height * 0.01,
  },
});
