module.exports = function (api) {
  api.cache(true);
  let plugins = [];

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
