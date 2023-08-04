import {
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import FeaturedStories from '../components/Home/FeaturedStories';
import Categories from '../components/Home/Categories';
import useFetchTales from '../hooks/useFetchTales';
import LoadingAnimation from '../components/Animations/LoadingAnimation';
import ErrorAnimation from '../components/Animations/ErrorAnimation';
import MyStories from '../components/Home/MyStories';

const Home = () => {
  const { tales, categories, loading, error } = useFetchTales();

  const [data, setData] = useState([
    {
      id: '1',
      title: 'The Adventure of the Speckled Band',
      author: 'Arthur Conan Doyle',
      bookmarks: '1.2k',
      category: 'Adventure',
      content:
        'The Adventure of the Speckled Band is one of the 56 short Sherlock Holmes stories written by Scottish author Sir Arthur Conan Doyle. It is the eighth of the twelve stories collected in The Adventures of Sherlock Holmes. It is one of four Sherlock Holmes stories that can be classified as a locked room mystery. The story was first published in Strand Magazine in February 1892, with illustrations by Sidney Paget. It was published under the different title The Spotted Band in New York World in August 1905. Doyle later revealed that he thought this was his best Holmes story. Doyle wrote and produced a play based on the story. It premiered at the Adelphi Theatre, London on 4 June 1910, with H. A. Saintsbury as Sherlock Holmes and Lyn Harding as Dr. Grimesby Roylott. The play was revived twice in London, in 1918 and 1923. It was also produced twice on Broadway, in 1910 and 1958. The 1910 production, which opened at the Garrick Theatre on 5 September 1910, ran for 239 performances. The 1958 production, which opened at the Morosco Theatre on 12 October 1958, ran for 71 performances. The play was adapted for BBC Radio 4 in 1994, starring Clive Merrison as Holmes and Michael Williams as Watson. The story was adapted for The Adventures of Sherlock Holmes, an American radio show that aired from 1930 to 1936. The story was adapted for the 1984–1995 Sherlock Holmes series starring Jeremy Brett. The story was adapted for the 1984–1995 Sherlock Holmes series starring Jeremy Brett. The story was adapted for the 1984–1995 Sherlock Holmes series starring Jeremy Brett. The story was adapted for the 1984–1995 Sherlock Holmes series starring Jeremy Brett. The story was adapted for the 1984–1995 Sherlock Holmes series starring Jeremy Brett. The story was adapted for the 1984–1995 Sherlock Holmes series starring Jeremy Brett. The story was adapted for the 1984–1995 Sherlock Holmes series starring Jeremy Brett. The story was adapted for the 1984–1995 Sherlock Holmes series starring Jeremy Brett.1958, ran for 71 performances. The play was adapted for BBC Radio 4 in 1994, starring Clive Merrison as Holmes and Michael Williams as Watson. The story was adapted for The Adventures of Sherlock Holmes, an American radio show that aired from 1930 to 1936.',
      imageUrl: 'https://source.unsplash.com/featured/?adventure',
      likes: '2.3k',
      lastRead: '01-01-2022',
    },
    {
      id: '2',
      title: 'The Adventure of the Speckled Band',
      author: 'Arthur Conan Doyle',
      bookmarks: '1.2k',
      category: 'Adventure',
      content:
        'The Adventure of the Speckled Band is one of the 56 short Sherlock Holmes stories written by Scottish author Sir Arthur Conan Doyle. It is the eighth of the twelve stories collected in The Adventures of Sherlock Holmes. It is one of four Sherlock Holmes stories that can be classified as a locked room mystery.',
      imageUrl:
        'https://images.unsplash.com/photo-1504851149312-7a075b496cc7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxfDB8MXxyYW5kb218MHx8YWR2ZW50dXJlfHx8fHx8MTY5MTAyNjU2OA&ixlib=rb-4.0.3&q=80&utm_campaign=api-credit&utm_medium=referral&utm_source=unsplash_source&w=1080',
      likes: '2.3k',
      lastRead: '03-08-2023',
    },
    {
      id: '3',
      title: 'The Adventure of the Speckled Band',
      author: 'Arthur Conan Doyle',
      bookmarks: '1.2k',
      category: 'Adventure',
      content:
        'The Adventure of the Speckled Band is one of the 56 short Sherlock Holmes stories written by Scottish author Sir Arthur Conan Doyle. It is the eighth of the twelve stories collected in The Adventures of Sherlock Holmes. It is one of four Sherlock Holmes stories that can be classified as a locked room mystery.',
      imageUrl:
        'https://images.unsplash.com/photo-1542235222-30e843cb43a1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwxfDB8MXxyYW5kb218MHx8YWR2ZW50dXJlfHx8fHx8MTY5MTAyNjU3Mw&ixlib=rb-4.0.3&q=80&utm_campaign=api-credit&utm_medium=referral&utm_source=unsplash_source&w=1080',
      likes: '2.3k',
      lastRead: '01-08-2023',
    },
  ]);
  const [data2, setdata2] = useState([
    {
      id: '1',
      name: 'Adventure',
    },
    {
      id: '2',
      name: 'Horrors',
    },
    {
      id: '3',
      name: 'Romance',
    },
    {
      id: '4',
      name: 'Thriller',
    },
    {
      id: '5',
      name: 'Action',
    },
  ]);

  if (loading) {
    return <LoadingAnimation />;
  }

  if (error) {
    return <ErrorAnimation />;
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
      <View style={styles.featureContainer}>
        <Text style={styles.featureText}>Featured Stories</Text>
        <FlatList
          data={data}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => <FeaturedStories data={item} />}
          keyExtractor={(item) => item.id}
        />
      </View>
      <View style={styles.categoriesContainer}>
        <Text style={styles.categoriesText}>Categories</Text>
        <FlatList
          data={data2}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => <Categories data={item} />}
        />
      </View>
      <View style={styles.myStoriesContainer}>
        <Text style={styles.myStoriesText}>My Stories</Text>
        <MyStories data={data2} />
      </View>
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Explore All</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 10,
    marginVertical: 20,
  },
  featureContainer: {},
  featureText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 24,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  categoriesContainer: {
    marginTop: 20,
  },
  categoriesText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  myStoriesContainer: {
    paddingHorizontal: 10,
  },
  myStoriesText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '500',
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#282828',
    borderRadius: 6,
    height: 48,
    justifyContent: 'center',
    marginVertical: 10,
    marginHorizontal: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    textAlign: 'center',
  },
});
