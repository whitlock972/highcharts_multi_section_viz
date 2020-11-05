let path = require('path');

let webpackConfig = {
    mode: "production",
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
    module: {
        rules: [
            { test: /\.ts$/, loader: 'ts-loader' },
            { test: /\.css$/, loader: [ 'to-string-loader', 'css-loader' ] },
            { test: /\.scss$/,
                use: [
                    'style-loader',
                    'css-loader',
                    'sass-loader',
                ]
            }
        ]
    }
};

module.exports = webpackConfig;
