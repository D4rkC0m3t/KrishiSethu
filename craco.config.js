
const ESLintPlugin = require('eslint-webpack-plugin');

module.exports = {
  webpack: {
    plugins: [
      new ESLintPlugin({
        extensions: ['js', 'jsx', 'ts', 'tsx'],
        fix: true,
        emitError: true,
        emitWarning: true,
        failOnError: false,
        type: 'webpack', 
      }),
    ],
  },
  devServer: {
    client: {
      overlay: false, // Disables the full-screen overlay for ESLint errors
    },
  },
};
