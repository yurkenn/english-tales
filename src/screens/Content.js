import React, { useLayoutEffect, useRef } from 'react';
import { StyleSheet, Text, View, Image, Dimensions } from 'react-native';
import { urlFor } from '../../sanity';
import TaleContent from '../components/Content/TaleContent';
import HeaderNavbar from '../components/Content/HeaderNavbar';
import TopNavbar from '../components/Content/TopNavbar';
import { Colors } from '../constants/colors';
import useGetTaleBySlug from '../hooks/useGetTaleBySlug';
import LoadingAnimation from '../components/Animations/LoadingAnimation';
import ErrorAnimation from '../components/Animations/ErrorAnimation';
import ParallaxScrollView from 'react-native-parallax-scroll-view';
import Animated, { FadeInDown } from 'react-native-reanimated';
const Content = ({ route }) => {
  const { slug } = route.params;
  const { loading, error, tale } = useGetTaleBySlug(slug);

  if (loading) return <LoadingAnimation />;
  if (error) return <ErrorAnimation />;
  if (!tale || !tale[0]) return null;

  return (
    <View style={styles.container}>
      {tale && (
        <ParallaxScrollView
          style={{
            flex: 1,
          }}
          backgroundColor={Colors.dark900}
          contentBackgroundColor={Colors.dark900}
          parallaxHeaderHeight={390}
          renderForeground={() => (
            <Image source={{ uri: urlFor(tale[0].imageURL).url() }} style={styles.headerImage} />
          )}
          stickyHeaderHeight={90}
          renderFixedHeader={() => <HeaderNavbar title={tale[0].title} />}
          renderStickyHeader={() => <TopNavbar title={tale[0].title} />}
        >
          <Animated.View entering={FadeInDown.delay(400)} style={styles.content}>
            <Text style={styles.title}>{tale[0]?.title}</Text>
            <TaleContent style={styles.blocks} blocks={tale[0].content} />
          </Animated.View>
        </ParallaxScrollView>
      )}
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark900,
  },
  headerImage: {
    height: height * 0.5,
    width: '100%',
    opacity: 0.85,
    resizeMode: 'cover',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: width < 400 ? 22 : 24, // smaller font size for smaller screens
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 10,
  },
  // ... other styles
});

export default Content;
