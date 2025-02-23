// const { getDefaultConfig } = require('@expo/metro-config');
// const { mergeConfig } = require('@react-native/metro-config');

// /**
//  * Metro configuration
//  * https://facebook.github.io/metro/docs/configuration
//  *
//  * @type {import('metro-config').MetroConfig}
//  */
// const config = {};

// module.exports = mergeConfig(getDefaultConfig(__dirname), config);

// const { getDefaultConfig } = require('expo/metro-config');
// 
// module.exports = getDefaultConfig(__dirname);
// 
// const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
// const { getDefaultConfig } = require('expo/metro-config');
// const {mergeConfig} = require('@react-native/metro-config');
// const {createSentryMetroSerializer} = require('@sentry/react-native/dist/js/tools/sentryMetroSerializer');

// const config = {
//   serializer: {
//     customSerializer: createSentryMetroSerializer(),
//   },
// };

// module.exports = mergeConfig(getDefaultConfig(__dirname), config);

/** ADDED 2/23/25 ** */

// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config')

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname)

config.transformer = {
  ...config.transformer,
  _expoRelativeProjectRoot: __dirname
}

module.exports = config
