import React, { useRef, useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ImageHeaderScrollView, TriggeringView } from 'react-native-image-header-scroll-view';
import * as Animatable from 'react-native-animatable';
import useGetTale from '../hooks/useGetTale';
import LoadingAnimation from '../components/Animations/LoadingAnimation';
import ErrorAnimation from '../components/Animations/ErrorAnimation';
import { urlFor } from '../../sanity';
import TaleContent from '../components/TaleContent';
import PortableText from 'react-portable-text';

const Content = ({ route }) => {
  const { slug } = route.params;
  console.log('SLUG: ', slug);
  const { tale, loading, error } = useGetTale(slug);

  console.log('TALE BURAYA GELDI: ', tale);

  const navTitleView = useRef(null);
  const [isTitleVisible, setTitleVisible] = useState(false);

  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY > 150 && !isTitleVisible) {
      setTitleVisible(true);
      navTitleView.current.fadeInUp(200);
    } else if (offsetY <= 150 && isTitleVisible) {
      setTitleVisible(false);
      navTitleView.current.fadeOut(100);
    }
  };

  if (loading) {
    return <LoadingAnimation />;
  }

  if (error) {
    return <ErrorAnimation />;
  }

  return (
    <View style={styles.container}>
      <ImageHeaderScrollView
        maxHeight={300}
        minHeight={Platform.OS === 'ios' ? 150 : 100}
        maxOverlayOpacity={0.6}
        minOverlayOpacity={0.3}
        renderHeader={() => (
          <Image
            source={{
              uri: ' https://images.unsplash.com/photo-1515263487990-61b07816b324?ixid=MXwxMjA3fDB8MHxzZWFyY2h8Mnx8YmFja2dyb3VuZCUyMHN0b3JlZCUyMHRhbGxpbmd8ZW58MHx8MHw%3D&ixlib=rb-1.2.1&w=1000&q=80',
            }}
            style={styles.headerImage}
          />
        )}
        renderForeground={() => (
          <View style={styles.foregroundContainer}>
            <Text style={styles.imageTitle}>{tale.title}</Text>
          </View>
        )}
        scrollViewBackgroundColor="white"
        fadeOutForeground
        onScroll={handleScroll}
      >
        <TriggeringView
          style={styles.content}
          onHide={() => navTitleView.current.fadeOut(100)}
          onDisplay={() => navTitleView.current.fadeInUp(200)}
        >
          <View style={styles.titleContainer}>
            <Animatable.View ref={navTitleView}>
              <Text style={styles.title}>{tale.title}</Text>
            </Animatable.View>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionContent}>{tale.description}</Text>
          </View>
          <View style={styles.section}>
            <TaleContent blocks={tale.body} />
          </View>
        </TriggeringView>
      </ImageHeaderScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  headerImage: {
    height: 300,
    width: '100%',
    resizeMode: 'cover',
  },
  foregroundContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
    marginTop: Platform.OS === 'ios' ? 14 : '',
  },
  imageTitle: {
    fontSize: Platform.OS === 'ios' ? 25 : 30,
    color: 'white',
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
  sectionContent: {
    fontSize: 16,
    textAlign: 'justify',
  },
  navTitleView: {
    position: 'absolute',
    left: 20,
    right: 0,
    top: Platform.OS === 'ios' ? 45 : 27,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 16,
    opacity: 0,
    zIndex: 1,
  },
  navTitle: {
    color: 'white',
    fontSize: 19,
    backgroundColor: 'transparent',
  },
});

export default Content;
