import { Looker, VisualizationDefinition } from '../common/types';
import { handleErrors, rounder } from '../common/utils';

import * as Highcharts from 'highcharts';
// Load module after Highcharts is loaded
require('highcharts/modules/heatmap')(Highcharts);

declare var looker: Looker;
let chartOptions: any;
chartOptions = {
    chart: {
        type: 'heatmap',
        marginTop: 40,
        marginBottom: 40,
        plotBorderWidth: 0,
        plotBorderColor: '#ffffff'
    },
    credits: {
        enabled: false
    },
    title: {
        floating: true,
        text: ''
    },
    xAxis: {
        categories: [],
        labels: {
            location: 'top',
            autoRotation: false,
            style: {
                fontSize: '8px'
            }
        },
        opposite: false
    },
    yAxis: {
        title: null,
        categories: [],
        labels: {
            overflow: 'allow',
            style: {
                fontSize: '12px'
            }
        }
    },
    legend: {
        align: 'right',
        layout: 'vertical',
        margin: 10,
        y: 25,
        verticalAlign: 'top',
        symbolHeight: 280
    },
    series: [
    ],
    plotOptions: {
        series: {
            states: {
                hover: {
                    enabled: false,
                    halo: null
                },
                select: {
                    halo: null
                }
            }
        }
    },
    tooltip: {
        formatter: function (tooltip) {
            if (this.point.isNull) {
                return 'Null';
            }
            return this.point.value;
        }
    }
};
let baseChartOptions = chartOptions;

interface CustomColumnViz extends VisualizationDefinition {
    elementRef?: HTMLDivElement,
}

const vis: CustomColumnViz = {
    id: 'custom-heatmap', // id/label not required, but nice for testing and keeping manifests in sync
    label: 'custom-heatmap',
    options: {},
    // Set up the initial state of the visualization
    create(element, config) {
        element.innerHTML = "Rendering ...";
        // chart = Highcharts.stockChart(element, chartOptions)
    },
    // Render in response to the data or settings changing
    async updateAsync(data, element, config, queryResponse, details, done) {

        element.innerHTML = '';

        const errors = handleErrors(this, queryResponse, {
            min_pivots: 1,
            max_pivots: 3,
            min_dimensions: 2,
            max_dimensions: 4,
            min_measures: 1,
            max_measures: 1
        });

        let measuresName = queryResponse.fields.measure_like[0].name;

        let dimensions = queryResponse.fields.dimension_like.map((field) => {
            let key = field.label;
            let value = field.name;
            return { [key]: value };
        });

        // These are the looker viz options. 
        let options = this.options;

        options["maxHeight"] =
        {
            section: "Axes",
            type: "number",
            display: "number",
            label: "Height (in pixels)",
            default: 500,
            placeholder: 500,
            order: 1
        };
        options["maxWidth"] =
        {
            section: "Axes",
            type: "number",
            display: "number",
            label: "Width (in pixels)",
            default: 1000,
            placeholder: 500,
            order: 2
        };
        options["reverseXY"] =
        {
            section: "Axes",
            type: "boolean",
            label: "Reverse X and Y Axes",
            order: 3
        };
        options["xAxisOnTop"] =
        {
            section: "Axes",
            type: "boolean",
            label: "Show X Axis on Top",
            default: "true",
            order: 4
        };
        options["xAxisFontSize"] =
        {
            section: "Axes",
            type: "number",
            display: "number",
            label: "X Axis Font Size",
            default: "12",
            order: 5
        };
        options["yAxisFontSize"] =
        {
            section: "Axes",
            type: "number",
            display: "number",
            label: "Y Axis Font Size",
            default: "12",
            order: 6
        };
        options["xAxisRotation"] =
        {
            section: "Axes",
            type: "boolean",
            label: "X Axis Rotation",
            order: 7
        };
        options["secondCategory"] =
        {
            section: "Values",
            type: "string",
            label: "X-Axis label dimension",
            display: "select",
            values: dimensions,
            order: 1
        };
        options["minValue"] =
        {
            section: "Values",
            type: "number",
            display: "number",
            label: "Minimum Value",
            default: 30,
            order: 2
        };
        options["maxValue"] =
        {
            section: "Values",
            type: "number",
            display: "number",
            label: "Maximum Value",
            default: 70,
            order: 3
        };
        options["showCellLabels"] =
        {
            section: "Values",
            type: "boolean",
            label: "Show Cell Labels",
            order: 4
        };
        options["decimalPrecision"] =
        {
            section: "Values",
            type: "number",
            display: "number",
            label: "Decimal Precision",
            default: 0,
            order: 5
        };
        options["internalBorder"] =
        {
            section: "Colors",
            type: "boolean",
            label: "Border Between Cells",
            order: 1
        };
        options['colorScheme'] =
        {
            section: "Colors",
            type: "string",
            label: "Color Scheme",
            display: "select",
            values: [
                { "Berlin": "Berlin" },
                { "Cork": "Cork" },
                { "Derek": "Derek" },
                { "Roma": "Roma" },
                { "Tofino": "Tofino" },
                { "Vik": "Vik" },
                { "Custom": "Custom" }
            ],
            default: "Derek",
            order: 2
        };
        options["minColor"] =
        {
            section: "Colors",
            type: "array",
            label: "Minimum Value Color",
            display: "color",
            default: "#263279",
            order: 3
        };
        options["midColor"] =
        {
            section: "Colors",
            type: "array",
            label: "Median Value Color",
            display: "color",
            default: "#D9DDDE",
            order: 4
        };
        options["maxColor"] =
        {
            section: "Colors",
            type: "array",
            label: "Maximum Value Color",
            display: "color",
            default: "#670D23",
            order: 5
        };

        this.trigger('registerOptions', options); // register options with parent page to update visConfig

        let xCategories: Array<string> = [];
        let seriesData: Array<any> = [];
        let yCategories: Array<string> = Object.keys(data[0][measuresName]).map(x => getFinalSectionOfPipedString(x));

        data.forEach(function (row, i) {
            var secondCategoryCell = row[config.secondCategory];
            var values = Object.values(data[i][measuresName]);

            values.map((x: any, j: number) => {
                if (config.reverseXY) {
                    seriesData.push([j, i, rounder(x.value, config.decimalPrecision)]);
                } else {
                    seriesData.push([i, j, rounder(x.value, config.decimalPrecision)]);
                }
            });

            xCategories.push(
                secondCategoryCell.value
            );
        });

        let pivotedSeries: any = {};
        pivotedSeries.data = seriesData;
        pivotedSeries.borderWidth = config.internalBorder ? 1 : 0;
        pivotedSeries.borderColor = 'white';

        if (config.showCellLabels) {
            pivotedSeries.dataLabels = {
                enabled: true,
                style: {
                    textOutline: 'none'
                },
                shape: 'circle',
                backgroundColor: '#FFFFFFAA',
                padding: 5,
                color: '#3E4857'
            };
        }

        //    These are the Highcharts options (not the looker viz config options)
        chartOptions = baseChartOptions;

        if (config.maxWidth && config.maxWidth > 0) {
            element.style.width = `${config.maxWidth}px`;
        }
        if (config.maxHeight && config.maxHeight > 0) {
            chartOptions.chart.height = `${config.maxHeight}px`;
        }

        if (config.reverseXY) {
            chartOptions.xAxis.categories = yCategories;
            chartOptions.yAxis.categories = xCategories;
        } else {
            chartOptions.xAxis.categories = xCategories;
            chartOptions.yAxis.categories = yCategories;
        }

        chartOptions.xAxis.labels.style.fontSize = `${config.xAxisFontSize}px`;
        chartOptions.yAxis.labels.style.fontSize = `${config.yAxisFontSize}px`;

        chartOptions.legend.symbolHeight = config.maxHeight - 200;

        if (config.xAxisOnTop && config.xAxisRotation) {
            chartOptions.xAxis.opposite = config.xAxisOnTop;
            chartOptions.xAxis.labels.rotation = -90;
            chartOptions.chart.marginTop = 200;
            chartOptions.chart.marginBottom = 0;
            chartOptions.chart.height = `${config.maxHeight + 200}px`;
            chartOptions.legend.y = 182;
        }
        else if (config.xAxisRotation) {
            delete chartOptions.xAxis.opposite;
            chartOptions.xAxis.labels.rotation = -90;
            chartOptions.chart.marginTop = 0;
            chartOptions.chart.marginBottom = 200;
            chartOptions.chart.height = `${config.maxHeight + 200}px`;
            chartOptions.legend.y = -10;
        }
        else if (config.xAxisOnTop) {
            chartOptions.xAxis.opposite = config.xAxisOnTop;
            delete chartOptions.xAxis.labels.rotation;
            chartOptions.chart.marginTop = 40;
            chartOptions.chart.marginBottom = 0;
            chartOptions.chart.height = `${config.maxHeight}px`;
            chartOptions.legend.y = 25;
        }
        else {
            delete chartOptions.xAxis.labels.rotation;
            delete chartOptions.xAxis.opposite;
            chartOptions.chart.marginTop = 0;
            chartOptions.chart.marginBottom = 40;
            chartOptions.chart.height = `${config.maxHeight}px`;
            chartOptions.legend.y = -10;
        }

        let colorAxis: any = {
            min: config.minValue || 40,
            max: config.maxValue || 60,
            reversed: false
        };
        if (config.colorScheme == 'Custom') {
            colorAxis.stops = [
                [0, `${config.minColor}` || '#263279'],
                [0.5, `${config.midColor}` || '#D9DDDE'],
                [1, `${config.maxColor}` || '#670D23']];
        }
        else {
            const stopsize = 1 / 15;
            if (config.colorScheme == 'Derek') {
                colorAxis.stops = [[0, '#3C0912'],
                [1 * stopsize, '#670D23'],
                [2 * stopsize, '#931327'],
                [3 * stopsize, '#B23727'],
                [4 * stopsize, '#C26245'],
                [5 * stopsize, '#CF8971'],
                [6 * stopsize, '#DBB1A3'],
                [7 * stopsize, '#E8D8D3'],
                [8 * stopsize, '#D9DDDE'],
                [9 * stopsize, '#A8C1CB'],
                [10 * stopsize, '#73A8BD'],
                [11 * stopsize, '#428EBA'],
                [12 * stopsize, '#166FBB'],
                [13 * stopsize, '#1C4BB2'],
                [14 * stopsize, '#263279'],
                [1, '#181C43']];
            }
            else if (config.colorScheme == 'Roma') {
                colorAxis.stops = [[0, '#7E1900'],
                [1 * stopsize, '#924410'],
                [2 * stopsize, '#A4661E'],
                [3 * stopsize, '#B48A2C'],
                [4 * stopsize, '#C5AD40'],
                [5 * stopsize, '#D9D26A'],
                [6 * stopsize, '#E5E598'],
                [7 * stopsize, '#DFECBB'],
                [8 * stopsize, '#BFEBD2'],
                [9 * stopsize, '#8CDED9'],
                [10 * stopsize, '#60C3D4'],
                [11 * stopsize, '#4CA3C9'],
                [12 * stopsize, '#3F85BB'],
                [13 * stopsize, '#3368B0'],
                [14 * stopsize, '#274DA4'],
                [1, '#1A3399']];
            }
            else if (config.colorScheme == 'Cork') {
                colorAxis.stops = [[0, '#434C01'],
                [1 * stopsize, '#406119'],
                [2 * stopsize, '#3F7A33'],
                [3 * stopsize, '#529754'],
                [4 * stopsize, '#73AD79'],
                [5 * stopsize, '#98C39B'],
                [6 * stopsize, '#BBD8BF'],
                [7 * stopsize, '#DFEBE1'],
                [8 * stopsize, '#DDE5EB'],
                [9 * stopsize, '#B6C6D8'],
                [10 * stopsize, '#8CA7C3'],
                [11 * stopsize, '#658AAD'],
                [12 * stopsize, '#3F6C99'],
                [13 * stopsize, '#2A4E80'],
                [14 * stopsize, '#2A3366'],
                [1, '#2C194C']];
            }
            else if (config.colorScheme == 'Tofino') {
                colorAxis.stops = [[0, '#DAE59A'],
                [1 * stopsize, '#A9CB80'],
                [2 * stopsize, '#76AE66'],
                [3 * stopsize, '#4A8C4B'],
                [4 * stopsize, '#336C38'],
                [5 * stopsize, '#244C27'],
                [6 * stopsize, '#183219'],
                [7 * stopsize, '#0E1B12'],
                [8 * stopsize, '#0E141D'],
                [9 * stopsize, '#19253D'],
                [10 * stopsize, '#263B65'],
                [11 * stopsize, '#395790'],
                [12 * stopsize, '#5777B9'],
                [13 * stopsize, '#8399D7'],
                [14 * stopsize, '#B0B8EB'],
                [1, '#DED8FF']];
            }
            else if (config.colorScheme == 'Berlin') {
                colorAxis.stops = [[0, '#FFACAC'],
                [1 * stopsize, '#DA8B84'],
                [2 * stopsize, '#B86A5B'],
                [3 * stopsize, '#964A35'],
                [4 * stopsize, '#722B15'],
                [5 * stopsize, '#501802'],
                [6 * stopsize, '#371000'],
                [7 * stopsize, '#210C01'],
                [8 * stopsize, '#121214'],
                [9 * stopsize, '#112632'],
                [10 * stopsize, '#194155'],
                [11 * stopsize, '#255F7B'],
                [12 * stopsize, '#327FA5'],
                [13 * stopsize, '#4C9DCE'],
                [14 * stopsize, '#76ABEB'],
                [1, '#9EB0FF']];
            }
            else if (config.colorScheme == 'Vik') {
                colorAxis.stops = [[0, '#601200'],
                [1 * stopsize, '#743100'],
                [2 * stopsize, '#875001'],
                [3 * stopsize, '#9F711B'],
                [4 * stopsize, '#B39148'],
                [5 * stopsize, '#C7AD78'],
                [6 * stopsize, '#DCCBA7'],
                [7 * stopsize, '#ECE6D8'],
                [8 * stopsize, '#D9E6EC'],
                [9 * stopsize, '#A5C9D9'],
                [10 * stopsize, '#70A7C3'],
                [11 * stopsize, '#3985AC'],
                [12 * stopsize, '#106496'],
                [13 * stopsize, '#014683'],
                [14 * stopsize, '#012C72'],
                [1, '#001260']];
            }
        }

        chartOptions.colorAxis = colorAxis;

        chartOptions.series = [pivotedSeries];

        var vizDiv = document.createElement('div');
        vizDiv.setAttribute('id', 'viz');
        element.appendChild(vizDiv);
        let vizDivRef = document.getElementById('viz');
        Highcharts.chart(vizDivRef, chartOptions);

        done();
    }
}

function getFinalSectionOfPipedString(input: string): string {
    let finalString: string = '';
    let array: Array<string> = input.split('|');
    finalString = array[array.length - 1];
    return finalString;
}

looker.plugins.visualizations.add(vis);
