import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Colors } from '../../constants/colors';
import { urlFor } from '../../../sanity';
import FormatReadTime from '../FormatReadTime';
import InfoContainer from './InfoContainer';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { wp, hp, isSmallDevice, deviceWidth } from '../../utils/dimensions';

const FeaturedStories = ({ data, navigation, index }) => {
  const formattedReadTime = FormatReadTime(data?.tales?.[0]?.readTime);

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 200).springify()}
      style={styles.animatedContainer}
    >
      <TouchableOpacity
        onPress={() => navigation.navigate('Detail', { data: data.tales[0] })}
        activeOpacity={0.7}
        style={styles.container}
      >
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

const styles = StyleSheet.create({
  animatedContainer: {
    marginHorizontal: wp(2),
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
    height: isSmallDevice ? hp(28) : hp(32),
    width: isSmallDevice ? wp(40) : wp(50),
    resizeMode: 'cover',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    justifyContent: 'flex-end',
    padding: isSmallDevice ? wp(2.5) : wp(3),
  },
  contentContainer: {
    gap: hp(1),
  },
  title: {
    color: Colors.white,
    fontSize: isSmallDevice ? wp(3.8) : wp(4.2),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default FeaturedStories;
