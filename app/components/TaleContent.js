import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import PortableText from 'react-portable-text';

const TaleContent = ({ blocks }) => {
  console.log('BLOCKS: ', blocks);
  return (
    <View>
      <PortableText content={blocks} />
    </View>
  );
};

export default TaleContent;

const styles = StyleSheet.create({
  h1: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  li: {
    fontSize: 16,
    marginBottom: 5,
  },
  p: {
    fontSize: 18,
    marginBottom: 10,
  },
  normal: {
    fontSize: 16,
  },
});
