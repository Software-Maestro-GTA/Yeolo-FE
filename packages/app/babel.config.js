/**
 * @file babel.config.js
 * @description Babel configuration for @yeolo/app.
 * @requirements REQ-11
 * @functional FUN-1
 * @api API-FB-1
 * @author Antigravity Agent
 */
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
