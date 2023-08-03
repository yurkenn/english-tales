import React from 'react';
import { Path, Svg } from 'react-native-svg';

export const AdventureIcon = () => {
  return (
    <Svg
      width="24"
      height="24"
      viewBox="0 0 512 512"
      style={{ width: 28, height: 28, overflow: 'visible', fill: 'rgb(255, 255, 255)' }}
    >
      <Path
        d="M64 400C64 408.8 71.16 416 80 416H480C497.7 416 512 430.3 512 448C512 465.7 497.7 480 480 480H80C35.82 480 0 444.2 0 400V64C0 46.33 14.33 32 32 32C49.67 32 64 46.33 64 64V400zM342.6 278.6C330.1 291.1 309.9 291.1 297.4 278.6L240 221.3L150.6 310.6C138.1 323.1 117.9 323.1 105.4 310.6C92.88 298.1 92.88 277.9 105.4 265.4L217.4 153.4C229.9 140.9 250.1 140.9 262.6 153.4L320 210.7L425.4 105.4C437.9 92.88 458.1 92.88 470.6 105.4C483.1 117.9 483.1 138.1 470.6 150.6L342.6 278.6z"
        fill={'white'}
      />
    </Svg>
  );
};

export const BookmarkIcon = () => {
  return (
    <Svg
      width="16"
      height="16"
      viewBox="0 0 384 512"
      style={{ width: 20, height: 20, overflow: 'visible', fill: 'rgb(255, 255, 255)' }}
    >
      <Path
        d="M384 48V512l-192-112L0 512V48C0 21.5 21.5 0 48 0h288C362.5 0 384 21.5 384 48z"
        fill={'#ffffff'}
      />
    </Svg>
  );
};
