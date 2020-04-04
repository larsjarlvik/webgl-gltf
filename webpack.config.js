const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
    entry: './example/src/app.ts',
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
            test: /\.ts$/,
            include: [path.resolve('./example'), path.resolve('./src')],
            use: [{ loader: 'ts-loader' }]
        },
        {
            test: /\.ts$/,
            enforce: 'pre',
            use: [{
                options: { eslintPath: require.resolve('eslint') },
                loader: require.resolve('eslint-loader'),
            }],
            exclude: /node_modules/,
        }
    ]},
    output: {
        path: __dirname + '/example/dist',
        publicPath: '/',
        filename: 'bundle.[hash].js',
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({ template: './example/index.html' }),
    ],
    devServer: {
        publicPath: '/',
        contentBase: './example/static',
        stats: {
            children: false,
            modules: false,
        },
    },
}
