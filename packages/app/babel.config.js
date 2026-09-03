/**
 * @file babel.config.js
 * @description Babel configuration for @yeolo/app.
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
