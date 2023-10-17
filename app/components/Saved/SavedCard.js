import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { Colors } from '../../constants/colors';

const SavedCard = ({ data }) => {
  return (
    <View>
      <Text style={{ color: Colors.white }}>{data.title}</Text>
    </View>
  );
};

export default SavedCard;

const styles = StyleSheet.create({});
