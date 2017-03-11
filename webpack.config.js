'use strict';

const path = require('path');

const fs = require('fs');

const webpack = require('webpack');

const OpenBrowserPlugin = require('open-browser-webpack-plugin');

let userscriptBanner = '';

if (process.env.NODE_ENV === 'production') {
    const version = require('./package.json').version;
    userscriptBanner = fs.readFileSync('./src/extra/userscript-banner.txt').toString();
    userscriptBanner = userscriptBanner.replace('${VERSION}', version);
}

module.exports = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, "dist"),
        publicPath: '/',
        filename: 'bundle.js'
    },
    target: "web",
    devtool: 'inline-source-map',
    plugins: [
        new webpack.BannerPlugin({
            banner: userscriptBanner.toString(),
            raw: true,
            entryOnly: true
        }),
        new OpenBrowserPlugin({ url: 'http://localhost:5005/development-loader.user.js' }),
        new OpenBrowserPlugin({ url: 'http://shatelland.com/upload' })
    ]
};


