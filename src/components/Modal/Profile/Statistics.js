import React, { useContext } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { useBookmark } from '../../../store/BookmarkContext';

const Statistics = ({ userData }) => {
  const { bookmarks } = useBookmark();

  const totalBookmarks = bookmarks?.length;
  const totalSessions = userData?.stats?.totalSessions;
  return (
    <View style={styles.container}>
      <View style={styles.bookmark}>
        <Text style={styles.bookmarkNumber}>{totalBookmarks}</Text>
        <Text style={styles.bookmarkText}>Favorite Tales</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.totalSessions}>
        <Text style={styles.totalSessionsNumber}>{totalSessions}</Text>
        <Text style={styles.totalSessionsText}>Total Sessions</Text>
      </View>
    </View>
  );
};

export default Statistics;

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    alignItems: 'center',
  },
  bookmark: {
    alignItems: 'center',
  },
  bookmarkNumber: {
    fontSize: width < 400 ? 22 : 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  bookmarkText: {
    fontSize: width < 400 ? 14 : 16,
    color: '#fff',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#fff',
  },
  totalSessions: {
    alignItems: 'center',
  },
  totalSessionsNumber: {
    fontSize: width < 400 ? 22 : 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  totalSessionsText: {
    fontSize: width < 400 ? 14 : 16,
    color: '#fff',
  },
});
