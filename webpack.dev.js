// let path = require('path');

// let webpackConfig = {
//     mode: "development",
//     entry: {
//         wpm_heatmap_chart: './src/visualizations/wpm_heatmap_chart.ts',
//         wpm_column_chart: './src/visualizations/wpm_column_chart.ts'
//     },
//     output: {
//         filename: '[name].js',
//         path: path.join(__dirname, 'dist'),
//         library: '[name]',
//         libraryTarget: 'umd'
//     },
//     resolve: {
//         extensions: ['.ts', '.js', '.scss', '.css']
//     },
//     module: {
//         rules: [
//             { test: /\.ts$/, loader: 'ts-loader' },
//             { test: /\.css$/, loader: [ 'to-string-loader', 'css-loader' ] },
//             { test: /\.scss$/,
//                 use: [
//                     'style-loader',
//                     'css-loader',
//                     'sass-loader',
//                 ]
//             }
//         ]
//     },
//     devServer: {
//         host: 'localhost',
//         headers: {
//             'Access-Control-Allow-Origin': '*',
//             'Access-Control-Allow-Headers': '*',
//         },
//         disableHostCheck: true,
//         contentBase: false,
//         compress: true,
//         port: 8443,
//         https: true
//     },
//     devtool: 'eval',
//     watch: true
// };

// module.exports = webpackConfig;
let path = require('path');

const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

let webpackConfig = {
    mode: 'none',
    entry: {
        wpm_heatmap_chart: './src/visualizations/wpm_heatmap_chart.ts',
        wpm_column_chart: './src/visualizations/wpm_column_chart.ts'
    },
    output: {
        filename: '[name].js',
        path: path.join(__dirname, 'dist'),
        library: '[name]',
        libraryTarget: 'umd'
    },
    resolve: {
        extensions: ['.ts', '.js', '.scss', '.css']
    },
    plugins: [
        new UglifyJSPlugin(),
    ],
    module: {
        rules: [
            { test: /\.ts$/, loader: 'ts-loader' },
            { test: /\.css$/, loader: ['to-string-loader', 'css-loader'] },
            { test: /\.(woff|woff2)$/,
                use: {
                    loader: 'url-loader',
                },
            }
        ],
    },
    devServer: {
        host: 'localhost',
        mode: 'development',
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
        },
        disableHostCheck: true,
        contentBase: false,
        compress: true,
        port: 8443,
        https: true
    },
    devtool: 'eval',
    watch: true
};

module.exports = webpackConfig;