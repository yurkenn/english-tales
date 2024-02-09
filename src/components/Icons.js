import React from 'react';
import { Ionicons } from '@expo/vector-icons';

const Icon = ({ name, size, color, style }) => {
  return <Ionicons name={name} size={size} color={color} style={style} />;
};

export default Icon;
