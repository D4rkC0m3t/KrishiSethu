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
  devServer: {
    // Fix WebSocket connection issues
    client: {
      webSocketURL: 'auto://0.0.0.0:0/ws',
      overlay: {
        errors: true,
        warnings: false,
      },
      reconnect: false, // Disable automatic reconnection attempts
    },
    // Additional WebSocket configuration
    hot: true,
    liveReload: true,
    // Suppress WebSocket connection errors
    onListening: function (devServer) {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }

      const port = devServer.server.address().port;
      console.log('✅ Development server listening on port:', port);
      console.log('🔇 WebSocket reconnection disabled to reduce console noise');
    },
  },
};
