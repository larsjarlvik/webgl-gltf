const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: './example/app.ts',
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
            include: [path.resolve('./example'), path.resolve('./src')],
            use: [{ loader: 'ts-loader' }]
        },
        {
            test: /\.(ts|tsx)$/,
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
        new HtmlWebpackPlugin({ template: './index.html' }),
    ],
    devServer: {
        contentBase: './static',
        stats: {
            children: false,
            modules: false,
        },
    },
}
