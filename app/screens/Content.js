import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { urlFor } from '../../sanity';
import TaleContent from '../components/Content/TaleContent';
import { AnimatedScrollView } from '@kanelloc/react-native-animated-header-scroll-view';
import HeaderNavbar from '../components/Content/HeaderNavbar';
import TopNavbar from '../components/Content/TopNavbar';
import { Colors } from '../constants/colors';
import useGetTale from '../hooks/useGetTale';
import LoadingAnimation from '../components/Animations/LoadingAnimation';
import ErrorAnimation from '../components/Animations/ErrorAnimation';

const Content = ({ route }) => {
  const { slug } = route.params;
  console.log('DATA: ', slug);

  const { loading, error, tale } = useGetTale(slug);
  console.log('TALE: ', tale);

  if (loading) return <LoadingAnimation />;
  if (error) return <ErrorAnimation />;

  return (
    <View style={styles.container}>
      {tale && (
        <AnimatedScrollView
          headerImage={{ uri: urlFor(tale[0].imageURL).url() }}
          HeaderNavbarComponent={<HeaderNavbar title={tale[0].title} />}
          TopNavBarComponent={<TopNavbar title={tale[0].title} />}
          imageStyle={styles.headerImage}
          disableScale={true}
        >
          <View style={styles.content}>
            <TaleContent style={styles.blocks} blocks={tale[0].content} />
          </View>
        </AnimatedScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primaryBackground,
  },
  headerImage: {
    height: 300,
    width: '100%',
    opacity: 0.8,
    resizeMode: 'cover',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 20,
    color: Colors.white,
  },
});

export default Content;
