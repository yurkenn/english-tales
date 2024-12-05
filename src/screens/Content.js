import React from 'react';
import { StyleSheet, Text, View, Image, useWindowDimensions } from 'react-native';
import { urlFor } from '../../sanity';
import TaleContent from '../components/Content/TaleContent';
import HeaderNavbar from '../components/Content/HeaderNavbar';
import { Colors } from '../constants/colors';
import useGetTaleBySlug from '../hooks/useGetTaleBySlug';
import LoadingAnimation from '../components/Animations/LoadingAnimation';
import ErrorAnimation from '../components/Animations/ErrorAnimation';
import Animated, {
  FadeInDown,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

const Content = ({ route }) => {
  const { width, height } = useWindowDimensions();
  const { slug } = route.params;
  const { loading, error, tale } = useGetTaleBySlug(slug);
  const scrollY = useSharedValue(0);

  const imageHeight = height * 0.5;
  const headerHeight = height * 0.12; // Increased header height
  const paddingHorizontal = width * 0.05;
  const titleSize = height * 0.035;
  const contentPadding = height * 0.03;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, imageHeight * 0.7], [0, 1], 'clamp');
    return { opacity };
  });

  if (loading) return <LoadingAnimation />;
  if (error) return <ErrorAnimation />;
  if (!tale || !tale[0]) return null;

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.stickyHeader, headerStyle, { height: headerHeight }]}>
        <HeaderNavbar title={tale[0]?.title} style={{ height: headerHeight }} />
      </Animated.View>

      <Animated.ScrollView onScroll={scrollHandler} scrollEventThrottle={16}>
        <Image
          source={{ uri: urlFor(tale[0].imageURL).url() }}
          style={[styles.headerImage, { height: imageHeight }]}
        />
        <Animated.View
          entering={FadeInDown.delay(400)}
          style={[
            styles.content,
            {
              paddingHorizontal,
              paddingVertical: contentPadding,
            },
          ]}
        >
          <Text
            style={[
              styles.title,
              {
                fontSize: titleSize,
                marginBottom: height * 0.02,
              },
            ]}
          >
            {tale[0]?.title}
          </Text>
          <TaleContent style={styles.blocks} blocks={tale[0].content} />
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark900,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: Colors.dark900,
    justifyContent: 'center',
  },
  headerImage: {
    width: '100%',
    resizeMode: 'cover',
    opacity: 0.8,
  },
  content: {
    flex: 1,
    backgroundColor: Colors.dark900,
  },
  title: {
    fontWeight: 'bold',
    color: Colors.white,
  },
});

export default Content;
