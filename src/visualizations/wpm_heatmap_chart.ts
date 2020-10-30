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
        marginBottom: 80,
        plotBorderWidth: 0,
        plotBorderColor: 'white',
        height: '100%'
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
        verticalAlign: 'top',
        y: 25,
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
            label: "Height (as a % of width)"
        };
        options["firstCategory"] =
        {
            section: "Values",
            type: "string",
            label: "X-Axis category dimension",
            display: "select",
            values: dimensions
        };
        options["secondCategory"] =
        {
            section: "Values",
            type: "string",
            label: "X-Axis label dimension",
            display: "select",
            values: dimensions,
        };
        options["decimalPrecision"] =
        {
            section: "Values",
            type: "number",
            display: "number",
            label: "Decimal Precision",
            default: 0
        };
        options["xAxisFontSize"] =
        {
            section: "Axes",
            type: "number",
            display: "number",
            label: "X Axis Font Size",
            default: "8"
        };
        options["reverseXY"] =
        {
            section: "Axes",
            type: "boolean",
            label: "Reverse X and Y Axes"
        };
        options["xAxisOnTop"] =
        {
            section: "Axes",
            type: "boolean",
            label: "Show X Axis on Top",
            default: "true"
        };
        options["yAxisFontSize"] =
        {
            section: "Axes",
            type: "number",
            display: "number",
            label: "Y Axis Font Size",
            default: "12"
        };
        options["xAxisRotation"] =
        {
            section: "Axes",
            type: "boolean",
            label: "X Axis Rotation"
        };
        options["maxWidth"] =
        {
            section: "Axes",
            type: "number",
            display: "number",
            label: "Maximum Width (in pixels)"
        };
        options["internalBorder"] =
        {
            section: "Colors",
            type: "boolean",
            label: "Border Between Cells"
        };
        options["minColor"] =
        {
            section: "Colors",
            type: "array",
            label: "Minimum Value Color",
            display: "color",
            default: "#263279"
        };
        options["midColor"] =
        {
            section: "Colors",
            type: "array",
            label: "Median Value Color",
            display: "color",
            default: "#D9DDDE"
        };
        options["maxColor"] =
        {
            section: "Colors",
            type: "array",
            label: "Maximum Value Color",
            display: "color",
            default: "#670D23"
        };
        options['colorScheme'] =
        {
            section: "Colors",
            type: "string",
            label: "Color Scheme",
            display: "select",
            values: [
                { "Derek": "Derek" },
                { "Roma": "Roma" },
                { "Custom": "Custom" }
            ],
            default: "Derek"
        };
        options["minValue"] =
        {
            section: "Values",
            type: "number",
            display: "number",
            label: "Minimum Value",
            default: 30
        };
        options["maxValue"] =
        {
            section: "Values",
            type: "number",
            display: "number",
            label: "Maximum Value",
            default: 70
        };
        options["showCellLabels"] =
        {
            section: "Values",
            type: "boolean",
            label: "Show Cell Labels"
        };

        this.trigger('registerOptions', options); // register options with parent page to update visConfig

        let xCategories: Array<string> = [];
        let seriesData: Array<any> = [];
        let primaryLabelClasses: Array<string> = [];
        let yCategories: Array<string> = Object.keys(data[0][measuresName]).map(x => getFinalSectionOfPipedString(x));

        data.forEach(function (row, i) {
            var firstCategoryCell = row[config.firstCategory];
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
            primaryLabelClasses.push(firstCategoryCell.value.replace(/\s/g, '_'));
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
                }
            };
        }

        //    These are the Highcharts options (not the looker viz config options)
        chartOptions = baseChartOptions;

        if (config.maxWidth && config.maxWidth > 0) element.style.width = `${config.maxWidth}px`;
        if (config.maxHeight && config.maxHeight > 0) {
            chartOptions.chart.height = `${config.maxHeight}%`;
        }
        chartOptions.xAxis.opposite = config.xAxisOnTop;

        if (config.reverseXY) {
            chartOptions.xAxis.categories = yCategories;
            chartOptions.yAxis.categories = xCategories;
        } else {
            chartOptions.xAxis.categories = xCategories;
            chartOptions.yAxis.categories = yCategories;
        }
        chartOptions.xAxis.labels.style.fontSize = `${config.xAxisFontSize}px`;
        chartOptions.yAxis.labels.style.fontSize = `${config.yAxisFontSize}px`;

        if (config.xAxisRotation) {
            chartOptions.xAxis.labels.rotation = -90;
        } else {
            delete chartOptions.xAxis.labels.rotation;
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
