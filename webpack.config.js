const path = require('path');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');
const ImageminWebpWebpackPlugin = require('imagemin-webp-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

const isDev = process.env.NODE_ENV === 'development';
const isProd = !isDev;

const optimizeCss = () => {
   if (isProd) return [new CssMinimizerPlugin(), new TerserWebpackPlugin()];
   return '';
};

const filename = ext =>
   isDev ? `[name].${ext}` : `[name].[contenthash].${ext}`;

const babelOptions = preset => {
   const obj = {
      exclude: /node_modules/,
      use: {
         loader: 'babel-loader',
         options: {
            presets: ['@babel/preset-env'],
         },
      },
   };

   if (preset) obj.use.options.presets.push(preset);

   return obj;
};

module.exports = {
   context: path.resolve(__dirname, 'src'),
   entry: {
      main: ['@babel/polyfill', './index.js'],
   },
   output: {
      filename: `js/${filename('js')}`,
      path: path.resolve(__dirname, 'dist'),
      clean: true,
   },
   resolve: {
      extensions: ['.js', 'json', '.jpg', '.jpeg', '.png', '.svg', 'gif'],
      alias: {
         '@model': path.resolve(__dirname, 'src/scripts/mvc/model'),
         '@view': path.resolve(__dirname, 'src/scripts/mvc/view'),
         '@controller': path.resolve(__dirname, 'src/scripts/mvc/controller'),
         '@styles': path.resolve(__dirname, 'src/styles'),
         '@assets': path.resolve(__dirname, 'src/assets'),
         '@scripts': path.resolve(__dirname, 'src/scripts'),
         '@fonts': path.resolve(__dirname, 'src/fonts'),
         '@images': path.resolve(__dirname, 'src/images'),
      },
   },
   devServer: {
      watchFiles: ['src/**/*'],
      hot: isDev,
      open: true,
      port: 4200,
   },
   devtool: isDev ? 'source-map' : false,
   performance: {
      hints: false,
   },
   plugins: [
      new HTMLWebpackPlugin({
         template: './index.html',
         minify: {
            collapseWhitespace: isProd,
         },
      }),
      new MiniCssExtractPlugin({
         filename: `styles/${filename('css')}`,
      }),
   ],
   module: {
      rules: [
         {
            test: /\.css$/,
            use: [MiniCssExtractPlugin.loader, 'css-loader'],
         },
         {
            test: /\.s[ac]ss$/,
            use: [
               MiniCssExtractPlugin.loader,
               'css-loader',
               {
                  loader: 'sass-loader',
                  options: {
                     implementation: require('node-sass'), // eslint-disable-line global-require
                  },
               },
            ],
         },
         {
            test: /\.(png|svg|jpg|jpeg|gif)$/,
            type: 'asset/resource',
            generator: {
               filename: 'images/[name]-[hash][ext]',
            },
         },
         {
            test: /\.(ttf|woff|woff2)$/,
            type: 'asset/resource',
            generator: {
               filename: 'fonts/[hash][ext]',
            },
         },
         {
            test: /\.xml$/,
            use: ['xml-loader'],
         },
         {
            test: /\.m?js$/,
            ...babelOptions(),
         },
         {
            test: /\.ts$/,
            ...babelOptions('@babel/preset-typescript'),
         },
         {
            test: /\.jsx$/,
            ...babelOptions('@babel/preset-react'),
         },
      ],
   },
   optimization: {
      minimizer: [
         new ImageMinimizerPlugin({
            minimizer: {
               implementation: ImageMinimizerPlugin.imageminMinify,
               options: {
                  plugins: [
                     ['gifsicle', { interlaced: true }],
                     ['mozjpeg', { progressive: true }],
                     ['pngquant', { quality: [0.1, 0.2] }],
                     [
                        'svgo',
                        {
                           plugins: [
                              {
                                 name: 'preset-default',
                                 params: {
                                    overrides: {
                                       removeViewBox: false,
                                       addAttributesToSVGElement: {
                                          params: {
                                             attributes: [
                                                {
                                                   xmlns: 'http://www.w3.org/2000/svg',
                                                },
                                             ],
                                          },
                                       },
                                    },
                                 },
                              },
                           ],
                        },
                     ],
                  ],
               },
            },
         }),
         new ImageminWebpWebpackPlugin(),
         ...optimizeCss(),
         new BundleAnalyzerPlugin(),
      ],
      splitChunks: {
         chunks: 'all',
      },
   },
};