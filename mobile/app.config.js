const { withEntitlementsPlist } = require('expo/config-plugins');

// Remove capabilities left behind by an earlier native prebuild.
const withoutAppleSignIn = config => withEntitlementsPlist(config, config => {
  delete config.modResults['com.apple.developer.applesignin'];
  return config;
});

// Only public configuration is copied to the client bundle.
module.exports = ({ config }) => {
  const appleSignInEnabled = process.env.EXPO_PUBLIC_APPLE_SIGN_IN_ENABLED === 'true';
  return {
    ...config,
    ios: { ...config.ios, usesAppleSignIn: appleSignInEnabled },
    plugins: config.plugins
      .filter(plugin => appleSignInEnabled || (Array.isArray(plugin) ? plugin[0] : plugin) !== 'expo-apple-authentication')
      .map(plugin => (Array.isArray(plugin) ? plugin[0] : plugin) === '@clerk/expo'
        ? ['@clerk/expo', { ...(Array.isArray(plugin) ? plugin[1] : {}), appleSignIn: appleSignInEnabled }]
        : plugin)
      .concat(appleSignInEnabled ? [] : [withoutAppleSignIn]),
    extra: {
      ...config.extra,
      appleSignInEnabled,
      googleSignInEnabled: process.env.EXPO_PUBLIC_GOOGLE_SIGN_IN_ENABLED === 'true',
      EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_CLERK_GOOGLE_WEB_CLIENT_ID || '',
      EXPO_PUBLIC_CLERK_GOOGLE_IOS_CLIENT_ID: process.env.EXPO_PUBLIC_CLERK_GOOGLE_IOS_CLIENT_ID || '',
      EXPO_PUBLIC_CLERK_GOOGLE_IOS_URL_SCHEME: process.env.EXPO_PUBLIC_CLERK_GOOGLE_IOS_URL_SCHEME || '',
    },
  };
};
