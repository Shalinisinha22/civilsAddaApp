module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./'],
        extensions: ['.ts', '.tsx', '.js', '.json'],
        alias: {
          '@api': './src/api',
          '@screens': './src/screens',
          '@components': './src/components',
          '@navigation': './src/navigation',
          '@contexts': './src/contexts',
          '@theme': './src/theme',
          '@i18n': './src/i18n',
          '@config': './src/config',
        },
      },
    ],
    'react-native-reanimated/plugin',
  ],
};