module.exports = function (api) {
  api.cache(true);
  let plugins = [];

  plugins.push([
    'react-native-unistyles/plugin',
    {
      root: 'app',
      autoProcessImports: ['~/components'],
    },
  ]);

  plugins.push('react-native-worklets/plugin');

  return {
    presets: ['babel-preset-expo'],

    plugins,
  };
};
