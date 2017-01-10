var webpack = require('webpack'),
    ExtractTextPlugin = require("extract-text-webpack-plugin"),
    CopyWebpackPlugin = require("copy-webpack-plugin"),
    CrxWebpackPlugin = require('crx-webpack-plugin'),
    ZipPlugin = require('zip-webpack-plugin'),
    merge = require('webpack-merge'),
    common = require('./webpack.config'),
    path = require('path');

var extensionResourcePath = path.join(__dirname, '../extension'),
    extensionContentPath = path.join(__dirname, '../extension/dist/chrome'),
    extensionOutputPath = path.join(__dirname, '../extension/dist'),
	extensionSecretsPath = path.join(__dirname, '../extension'),
    appPath = path.join(__dirname, '../app');

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
            { from: path.join(__dirname, '../assets'), to: path.join(extensionContentPath, '/assets'), ignore: '*.db' },
            { from: path.join(__dirname, '../extension/assets'), to: path.join(extensionContentPath, '/assets'), ignore: '*.db' },
            { from: path.join(__dirname, '../extension/manifest_chrome.json'), to: path.join(extensionContentPath, '/manifest.json') },
            { from: path.join(__dirname, '../extension/background.js'), to: extensionContentPath },
			{ from: path.join(extensionSecretsPath, '/chrome.pem'), to: path.join(extensionContentPath, '/key.pem') }
        ]),
        new webpack.optimize.UglifyJsPlugin(),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production')
        }),
        sass,
        new CrxWebpackPlugin({
            // updateUrl: 'http://localhost:8000/',
            // updateFilename: 'updates.xml',
            keyFile: path.join(extensionSecretsPath, '/chrome.pem'),
            contentPath: extensionContentPath,
            outputPath: extensionOutputPath,
            name: 'tdo'
        }),
        new ZipPlugin({
            path: extensionOutputPath,
            filename: 'chrome.zip'
        })
    ],

    entry: {
        app: [
            path.join(appPath, 'extension.js')
        ]
    },

    output: {
        path: extensionContentPath,
        publicPath: '.'
    }
};

module.exports = merge(common, specific);
