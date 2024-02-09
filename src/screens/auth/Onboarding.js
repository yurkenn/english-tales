import { Button, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import Swiper from 'react-native-swiper';
import Images from '../../components/Onboarding/ImageList';
import { Colors } from '../../constants/colors';
const Onboarding = ({ navigation }) => {
  const imageList = [
    {
      id: 1,
      title: 'Explore Diverse Tales',
      description:
        'Discover a wide range of tales spanning different categories, including fantasy, nature, animals, and more, tailored to suit your preferences and interests.',
      image: Images.first,
    },
    {
      id: 2,
      title: 'Personalized Experience',
      description: 'Create your own library by saving your favorite tales for later enjoyment. ',
      image: Images.second,
    },
    {
      id: 3,
      title: 'Read Anywhere, Anytime',
      description:
        'Enjoy your favorite tales on the go, at home, or anywhere else. All you need is an internet connection.',
      image: Images.third,
    },
  ];

  const handleGetStarted = () => {
    navigation.navigate('Signup');
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <Swiper
        dotStyle={{
          backgroundColor: 'rgba(255,255,255,0.5)',
          width: 10,
          height: 10,
          borderRadius: 5,
          marginHorizontal: 5,
        }}
        activeDotStyle={{
          backgroundColor: Colors.white,
          width: 10,
          height: 10,
          borderRadius: 5,
          marginHorizontal: 5,
        }}
        paginationStyle={{ bottom: 30 }}
      >
        {imageList.map((item) => (
          <View style={styles.headerContainer} key={item.id}>
            <Image style={styles.image} source={item.image} />
            <Text style={styles.h1}>{item.title}</Text>
            <Text style={styles.h2}>{item.description}</Text>
          </View>
        ))}
      </Swiper>
      <TouchableOpacity style={styles.getStartedButton} onPress={handleGetStarted}>
        <Text style={styles.getStartedText}>Get Started</Text>
      </TouchableOpacity>
      <View style={styles.textContainer}>
        <Text style={styles.t1}>Already Have An Account ?</Text>
        <Text onPress={handleLogin} style={styles.t2}>
          Log In
        </Text>
      </View>
    </View>
  );
};

export default Onboarding;

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: width / 1.2,
    height: height / 2.3,
    resizeMode: 'contain',
  },
  h1: {
    fontSize: height * 0.03,
    fontWeight: 'bold',
    marginVertical: height * 0.02,
    color: Colors.white,
  },
  h2: {
    fontSize: height * 0.02,
    textAlign: 'center',
    marginHorizontal: width * 0.1,
    color: Colors.white,
  },
  textContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: height * 0.05,
  },
  t1: {
    marginTop: height * 0.02,
    fontSize: height * 0.02,
    color: 'gray',
  },
  t2: {
    marginTop: height * 0.02,
    fontSize: height * 0.02,
    fontWeight: 'bold',
    marginLeft: 5,
    color: '#FFA500',
  },
  getStartedButton: {
    width: width * 0.8, // Use the same width for all buttons
    height: height * 0.06,
    padding: width * 0.02,
    backgroundColor: Colors.black,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  getStartedText: {
    color: Colors.white,
    fontSize: height * 0.018,
    lineHeight: 16,
    fontWeight: 'bold',
  },
});
