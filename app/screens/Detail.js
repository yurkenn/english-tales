import { StyleSheet, Text, View } from 'react-native';
import React from 'react';

const Detail = ({ route }) => {
  const { data } = route.params;
  console.log('DETAIL', data);

  return (
    <View>
      <Text>Detail</Text>
    </View>
  );
};

export default Detail;

const styles = StyleSheet.create({});
