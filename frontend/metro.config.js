const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Ensure Metro resolves old LoadingView imports to our shim
config.resolver = {
  ...(config.resolver || {}),
  extraNodeModules: {
    ...(config.resolver?.extraNodeModules || {}),
    "react-native/Libraries/Utilities/LoadingView": path.resolve(
      __dirname,
      "shims/LoadingView.js"
    ),
  },
};

module.exports = config;
