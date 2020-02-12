const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: './src/app.ts',
    resolve: {
        extensions: ['.ts', '.tsx', '.js'],
        modules: [
            path.resolve('./src'),
            path.resolve('./node_modules'),
        ],
    },
    devtool: 'source-map',
    module: {
        rules: [{
            test: /\.ts(x?)$/,
            include: [path.resolve('./src')],
            use: [{ loader: 'ts-loader' }]
        }],
    },
    output: {
        path: __dirname + '/dist',
        publicPath: '/',
        filename: 'bundle.js',
    },
    plugins: [
        new HtmlWebpackPlugin({ template: './index.html' }),
    ],
    devServer: {
        contentBase: './static',
        stats: {
            children: false,
            modules: false,
        },
    },
};