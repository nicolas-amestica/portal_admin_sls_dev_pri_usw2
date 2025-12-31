module.exports = {
  // Asegurar que pdf-lib se empaquete correctamente
  externals: [],

  // Configuración para manejar módulos ESM
  resolve: {
    extensions: ['.js', '.json'],
    fullySpecified: false
  },

  // Optimizaciones para Lambda
  optimization: {
    minimize: false, // Evitar minificación que puede romper pdf-lib
  },

  // Configuración de módulos
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: {
                  node: '20'
                }
              }]
            ]
          }
        }
      }
    ]
  }
};
