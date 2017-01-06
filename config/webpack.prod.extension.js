var webpack = require('webpack'),
    ExtractTextPlugin = require("extract-text-webpack-plugin"),
    CopyWebpackPlugin = require("copy-webpack-plugin"),
    CrxWebpackPlugin = require('crx-webpack-plugin'),
    merge = require('webpack-merge'),
    common = require('./webpack.config'),
    path = require('path');

var extensionResourcePath = path.join(__dirname, '../extension'),
    extensionContentPath = path.join(__dirname, '../dist_extension/chrome'),
    extensionOutputPath = path.join(__dirname, '../dist_extension');

var sass = new ExtractTextPlugin({
    filename: "app.css",
    allChunks: true
});

var specific = {
    module: {
        loaders: [{
            test: /\.scss$/,
            loaders: sass.extract(['css', 'sass'])
        }, {
            test: /\.css$/,
            loaders: sass.extract(['css'])
        }]
    },

    plugins: [
        new CopyWebpackPlugin([
            { from: path.join(__dirname, '../assets'), to: path.join(extensionContentPath, '/assets') },
            { from: path.join(__dirname, '../extension/assets'), to: path.join(extensionContentPath, '/assets') },
            { from: path.join(__dirname, '../extension/manifest_chrome.json'), to: path.join(extensionContentPath, '/manifest.json') }
        ]),
        new webpack.optimize.UglifyJsPlugin(),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production')
        }),
        sass,
        new CrxWebpackPlugin({
            // updateUrl: 'http://localhost:8000/',
            // updateFilename: 'updates.xml',
            keyFile: path.join(extensionResourcePath, '/.cert/secret_for_crx.pem'),
            contentPath: extensionContentPath,
            outputPath: extensionOutputPath,
            name: 'tdo'
        })
    ],

    output: {
        path: extensionContentPath,
        publicPath: '.'
    }
};

module.exports = merge(common, specific);
