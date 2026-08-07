module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-keychain|@react-native-async-storage|react-native-screens|react-native-safe-area-context|react-native-svg|lucide-react-native)/)',
  ],
};
