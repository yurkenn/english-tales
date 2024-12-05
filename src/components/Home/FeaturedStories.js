import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { Colors } from '../../constants/colors';
import { urlFor } from '../../../sanity';
import FormatReadTime from '../FormatReadTime';
import InfoContainer from './InfoContainer';
import Animated, { FadeInRight, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const FeaturedStories = ({ data, navigation, index }) => {
  const goDetailScreen = () => {
    if (data?.tales?.[0]) {
      navigation.navigate('Detail', { data: data.tales[0] });
    }
  };

  const formattedReadTime = FormatReadTime(data?.tales?.[0]?.readTime);

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 200).springify()}
      style={styles.animatedContainer}
    >
      <TouchableOpacity onPress={goDetailScreen} activeOpacity={0.7} style={styles.container}>
        <Animated.Image source={{ uri: urlFor(data?.imageURL).url() }} style={styles.image} />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.gradient}>
          <View style={styles.contentContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {data?.title}
            </Text>
            <InfoContainer readTime={formattedReadTime} likes={data?.tales?.[0]?.likes} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  animatedContainer: {
    marginHorizontal: width * 0.02,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  container: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    height: width * 0.7,
    width: width * 0.5,
    resizeMode: 'cover',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    justifyContent: 'flex-end',
    padding: width * 0.03,
  },
  contentContainer: {
    gap: height * 0.01,
  },
  title: {
    color: Colors.white,
    fontSize: width * 0.042,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default FeaturedStories;
