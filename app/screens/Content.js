import React from 'react';
import { StyleSheet, Text, View, Image } from 'react-native';
import { urlFor } from '../../sanity';
import TaleContent from '../components/Content/TaleContent';
import HeaderNavbar from '../components/Content/HeaderNavbar';
import TopNavbar from '../components/Content/TopNavbar';
import { Colors } from '../constants/colors';
import useGetTaleBySlug from '../hooks/useGetTaleBySlug';
import LoadingAnimation from '../components/Animations/LoadingAnimation';
import ErrorAnimation from '../components/Animations/ErrorAnimation';
import ParallaxScrollView from 'react-native-parallax-scroll-view';

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
          parallaxHeaderHeight={300}
          renderForeground={() => (
            <Image source={{ uri: urlFor(tale[0].imageURL).url() }} style={styles.headerImage} />
          )}
          stickyHeaderHeight={80}
          renderFixedHeader={() => <HeaderNavbar title={tale[0].title} />}
          renderStickyHeader={() => <TopNavbar title={tale[0].title} />}
        >
          <View style={styles.content}>
            <Text style={styles.title}>{tale[0]?.title}</Text>
            <TaleContent style={styles.blocks} blocks={tale[0].content} />
          </View>
        </ParallaxScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark900,
  },
  headerImage: {
    height: 340,
    width: '100%',
    opacity: 0.7,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 10,
  },
  infoContainer: {
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  author: {
    fontSize: 16,
    color: Colors.white,
  },
  category: {
    fontSize: 16,
    color: Colors.white,
  },
});

export default Content;
