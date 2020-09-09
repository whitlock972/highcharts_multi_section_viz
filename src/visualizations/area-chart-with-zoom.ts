import { Looker, VisualizationDefinition } from '../common/types';
import { handleErrors, formatType, getTimeSeriesXAxis } from '../common/utils';
import './area-chart-with-zoom.css';
import * as Highcharts from 'highcharts/highstock';
import { Chart, Options } from 'highcharts';

declare var looker: Looker;
let chart: Chart;
let chartOptions: Options;


interface AreaChartWithZoom extends VisualizationDefinition {
    elementRef?: HTMLDivElement,
}

const vis: AreaChartWithZoom = {
    id: 'navigator-chart', // id/label not required, but nice for testing and keeping manifests in sync
    label: 'navigator-chart',
    options: {
        color_range: {
            type: 'array',
            label: 'Color Range',
            display: 'colors',
            default: [
                "#75E2E2",
                "#3EB0D5",
                "#4276BE",
                "#592EC2",
                "#9174F0",
                "#B1399E",
                "#B32F37",
                "#E57947",
                "#FBB555",
                "#FFD95F",
                "#C2DD67",
                "#72D16D"
              ].map(value => {return value.toLowerCase()})
        },
        title: {
            type: 'string',
            label: 'Chart(s) with Navigator',
            display: 'text',
            default: 'Chart(s) with Navigator'
        },
        charts: {
            type: 'string',
            label: 'Type of Chart(s)',
            display: 'select',
            values: [
                { 'Line Chart': 'line' },
                { 'Bar Chart': 'bar' },
                // { 'Pie Chart': 'pie' }
            ],
            default: 'line'
        }
    },
    // Set up the initial state of the visualization
    create(element, config) {
        // let syncExtremes = (event) => {
        //     let thisChart = this.chart;

        //     if (event.trigger !== 'syncExtremes') { // prevent infinite loop
        //         Highcharts.each(Highcharts.charts, (chart => {
        //             if (chart !== thisChart) {
        //                 if (chart.xAxis[0].setExtremes) { // It is null while updating
        //                     chart.xAxis[0].setExtremes(
        //                         event.min,
        //                         event.max,
        //                         undefined,
        //                         false,
        //                         { trigger: 'syncExtremes' }
        //                     );
        //                 }
        //             }
        //         }))
        //     }
        // }

        // chart = Highcharts.stockChart(element, lineOptions);

        chartOptions = {
            accessibility: {
                description: 'Image description'
            },
            title: {
                text: null
            },
            legend: {
                enabled: true
            },
            yAxis: {
                type: "category",
                opposite: false,
                alignTicks: false,
                tickAmount: 6,
                title: {}
            },
            series: [],
            credits: {
                enabled: false
            },
            rangeSelector: {
                enabled: false
            },
            scrollbar: {
                enabled: true,
                // Effectively hide the scrollbar, this lets us leverage live reload 
                // while scrolling in the navigator without showing the
                // scrollbar
                height: 0,
                // alpha transparency of 0 effectively removes arrows from the "hidden" scrollbar
                buttonArrowColor: "rgba(1, 1, 1, 0)"
            },
            navigator: {
                handles: {
                    enabled: true,
                    // alpha transparency of 0 effectively removes handles while still being able to click and drag navigator
                    backgroundColor: "rgba(1, 1, 1, 0)",
                    borderColor: "rgba(1, 1, 1, 0)",
                    width: 10
                },
                outlineColor: "rgba(1, 1, 1, 0)",
                xAxis: {
                    type: "datetime",
                    startOnTick: true,
                    labels: {
                        enabled: true,
                        formatter: function () {
                            return Highcharts.dateFormat('%b %Y', this.value);
                        }
                    },
                    units: [
                        // ['day', [1, 2, 3, 4, 5, 6]],
                        ['month', [1, 3, 6]],
                        ['year', [1, 2, 3]]
                    ],
                    title: {
                        text: null
                    }
                }
            }
        };

        chart = Highcharts.stockChart(element, chartOptions);
    },
    // Render in response to the data or settings changing
    update(data, element, config, queryResponse) {
        console.log('data', data);
        console.log('element', element);
        console.log('config', config);
        console.log('queryResponse', queryResponse);
        const errors = handleErrors(this, queryResponse, {
            // min_pivots: 0,
            // max_pivots: 0,
            // min_dimensions: 1,
            // max_dimensions: 1,
            // min_measures: 1,
            // max_measures: 1
        });

        // // If the user has configured a different chart type we need to destroy
        // // the existing chart to re-render the new chart type.
        // if (chart && (config.charts !== chart.userOptions.chart.type)) {
        //     chart.destroy()
        // }

        // switch (config.charts) {
        //     case 'line':
        //         chart.destroy();
        //         chart = Highcharts.stockChart(element, lineOptions);
        //         break;
        //     case 'bar':
        //         chart.destroy();
        //         chart = Highcharts.stockChart(element, barOptions);
        //         break;
        //     case 'pie':
        //         chart.destroy();
        //         chart = Highcharts.stockChart(element, pieOptions);
        //         break;
        //     default:
        //         console.error(`Chart type ${config.charts} is not defined`);
        //         return;
        // }

        if (chart) {
            let pivotsInQuery = queryResponse.pivots;
            let pivots;
            if (pivotsInQuery && pivotsInQuery.length > 0) {
                // Create a mapping of measure -> pivots
                pivots = pivotsInQuery.map(pivot => (pivot.key));
            }

            let dimensions = queryResponse.fields.dimensions.map(dimension => {
                return { name: dimension.name, type: dimension.type, title: dimension.label_short }
            });
            let measures = queryResponse.fields.measures.map(measure => {
                return { name: measure.name, type: measure.type, title: measure.label_short }
            });

            let fields = dimensions.concat(measures);

            let timeSeries = fields.filter(field => (field.type && field.type.includes('date')));
            if (timeSeries.length > 1) {
                console.log("More than one date dimension or measure was found. Only one date dimension or measure is supported for time series data.");
            }

            
            let dataSerie = fields.filter(field => (field.type && !field.type.includes('date')));
            let serie = {};
            const chartType = config.charts || 'line';
            if (pivots) { 
                pivots.forEach(pivot => {
                    serie[pivot] = {
                        name: pivot,
                        id: pivot,
                        data: [],
                        type: chartType
                    }
                });
            } else {
                dataSerie.forEach(dataSeries => {
                    serie[dataSeries.name] = {
                        name: dataSeries.title,
                        id: dataSeries.name,
                        data: [],
                        type: chartType
                    }
                });
            }

            let minTime;
            let maxTime;
            data.map(datum => {
                let timePoint = formatType(timeSeries[0].type, datum[timeSeries[0].name].value);
                if (!maxTime || timePoint > maxTime) {
                    maxTime = timePoint;
                } else if (!minTime || timePoint < minTime) {
                    minTime = timePoint;
                }

                measures.forEach(({ name, type }) => {
                    if (pivots) {
                        pivots.forEach(pivot => {
                            serie[pivot]?.data.push([timePoint, datum[name][pivot].value])
                        });
                    } else {
                        let dataPoint = formatType(type, datum[name].value);
                        serie[name]?.data.push([timePoint, dataPoint])
                    }
                });
            });

            //highcharts expects sorted data:
            Object.values(serie).map((series: any) => {
                series.data.sort((a, b) => {
                    return a[0] - b[0];
                });
            });

            const xAxisOptions = getTimeSeriesXAxis(maxTime, minTime) as Highcharts.XAxisOptions;

            chart.update({
                colors: config.color_range,
                series: Object.values(serie),
                xAxis: xAxisOptions
            }, true, true);
        }
    }
};

looker.plugins.visualizations.add(vis);