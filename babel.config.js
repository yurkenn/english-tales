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

  // Remove console.log statements in production for better performance
  // Keeps console.error and console.warn for debugging
  if (process.env.NODE_ENV === 'production') {
    plugins.push(['transform-remove-console', { exclude: ['error', 'warn'] }]);
  }

  return {
    presets: ['babel-preset-expo'],

    plugins,
  };
};
