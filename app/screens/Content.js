import React, { useRef, useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ImageHeaderScrollView, TriggeringView } from 'react-native-image-header-scroll-view';
import * as Animatable from 'react-native-animatable';
import { urlFor } from '../../sanity';
import PortableText from 'react-portable-text';
import TaleContent from '../components/TaleContent';

const Content = ({ route }) => {
  const { data } = route.params;
  console.log('DATA: ', data);
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

  return (
    <View style={styles.container}>
      <ImageHeaderScrollView
        maxHeight={300}
        minHeight={100}
        maxOverlayOpacity={0.6}
        minOverlayOpacity={0.3}
        renderHeader={() => (
          <Image source={{ uri: urlFor(data.imageURL).url() }} style={styles.headerImage} />
        )}
        renderForeground={() => (
          <View style={styles.foregroundContainer}>
            <Text style={styles.imageTitle}>{data.title}</Text>
          </View>
        )}
        renderFixedForeground={() => (
          <Animatable.View
            style={[
              styles.navTitleView,
              {
                opacity: isTitleVisible ? 1 : 0,
              },
            ]}
            ref={navTitleView}
          >
            <Text style={styles.navTitle}>{data.title}</Text>
          </Animatable.View>
        )}
        onScroll={handleScroll}
      >
        <View style={styles.content}>
          <TriggeringView>
            <Text style={styles.title}>About {data.title}</Text>
          </TriggeringView>
          <TaleContent blocks={data.tales[0].content} />
        </View>
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
    flex: 1,
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
