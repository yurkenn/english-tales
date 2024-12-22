import React from 'react';
import { Ionicons, MaterialIcons, FontAwesome, Entypo } from '@expo/vector-icons';

const Icon = ({ name, size, color, style, type = 'ionicon' }) => {
  let IconComponent;

  switch (type) {
    case 'material':
      IconComponent = MaterialIcons;
      break;
    case 'fontawesome':
      IconComponent = FontAwesome;
      break;
    case 'entypo':
      IconComponent = Entypo;
      break;
    case 'ionicon':
    default:
      IconComponent = Ionicons;
      break;
  }

  return <IconComponent name={name} size={size} color={color} style={style} />;
};

export default Icon;
