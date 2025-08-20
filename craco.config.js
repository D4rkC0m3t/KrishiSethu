module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Suppress source map warnings for third-party packages
      webpackConfig.ignoreWarnings = [
        {
          module: /html2pdf\.js/,
          message: /Failed to parse source map/,
        },
        {
          module: /node_modules/,
          message: /Failed to parse source map/,
        },
      ];

      // Disable source map generation for production builds
      if (process.env.NODE_ENV === 'production') {
        webpackConfig.devtool = false;
      }

      return webpackConfig;
    },
  },
};
