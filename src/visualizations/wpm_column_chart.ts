import { Looker, VisualizationDefinition } from '../common/types';
import { handleErrors, lookupColor, lookupSecondaryColor, rounder, getDomainNameFromPrimaryLabel } from '../common/utils';
import './wpm_column_chart.css';
import * as Highcharts from 'highcharts';

declare var looker: Looker;
let chartOptions: any;

chartOptions = {
    chart: {
        type: 'column',
        animation: false
    },
    credits: {
        enabled: false
    },
    title: {
        text: 'Whole Person Model'
    },
    subtitle: {
        text: ''
    },
    xAxis: {
        categories: [],
        labels: {
            autoRotation: false,
            style: {
                fontSize: '0.75rem'
            }
        }
    },
    yAxis: {
        title: null,
        max: 80,
        min: 20,
        gridLineWidth: 0
    },
    legend: {
        align: 'center',
        verticalAlign: 'top',
        x: 0,
        y: 15
    },
    series: [
    ],
    plotOptions: {
        series: {
            pointPadding: 0,
            animation: false
        }
    }
};
let baseChartOptions = chartOptions;

interface CustomColumnViz extends VisualizationDefinition {
    elementRef?: HTMLDivElement,
}

const vis: CustomColumnViz = {
    id: 'wpm_column_chart', // id/label not required, but nice for testing and keeping manifests in sync
    label: 'whole-person-model',
    options: {
        title: {
            type: 'string',
            label: 'Title',
            placeholder: 'Whole Person Model'
        },
        subtitle: {
            type: 'string',
            label: 'Subtitle'
        }
    },
    // Set up the initial state of the visualization
    create(element, config) {
        element.innerHTML = "Rendering ...";
    },
    // Render in response to the data or settings changing
    updateAsync(data, element, config, queryResponse, details, done) {

        element.innerHTML = '';
        let totalWidth: number = document.body.clientWidth;
        const errors = handleErrors(this, queryResponse, {
            max_pivots: 0,
            min_dimensions: 2,
            max_dimensions: 3,
            min_measures: 2,
            max_measures: 4
        });

        let measures = queryResponse.fields.measure_like.map((field) => {
            let key = field.label;
            let value = field.name;
            return { [key]: value };
        });
        queryResponse.fields.table_calculations.forEach(element => {
            measures.push({[element.label]: element.name})
        });
        let measures_blank = [...measures];
        let blank = "";
        measures_blank.push({[blank]: blank});

        let dimensions = queryResponse.fields.dimension_like.map((field) => {
            let key = field.label;
            let value = field.name;
            return { [key]: value };
        });

        let options = this.options;
        options["domain"] =
        {
            section: "X-Axis",
            type: "string",
            label: "Domain",
            display: "select",
            values: dimensions,
            order: 1
        };
        options["firstCategory"] =
        {
            section: "X-Axis",
            type: "string",
            label: "Column Group Label",
            display: "select",
            values: dimensions,
            order: 2
        };
        options["secondCategory"] =
        {
            section: "X-Axis",
            type: "string",
            label: "Column Label",
            display: "select",
            values: dimensions,
            order: 3
        };
        options["benchmarkMeasure"] =
        {
            section: "Y-Axis",
            type: "string",
            label: "Industry Benchmark",
            display: "select",
            values: measures,
            order: 1
        };
        options["benchmarkIcon"] = {
            section: "Y-Axis",
            type: "string",
            label: "Benchmark Point Icon URL",
            default: 'https://freesvg.org/img/line-drawn.png',
            order: 2
        };
        options["baselineMeasure"] =
        {
            section: "Y-Axis",
            type: "string",
            label: "Baseline",
            display: "select",
            values: measures,
            order: 3
        };
        options["reflectionPoint1Measure"] =
        {
            section: "Y-Axis",
            type: "string",
            label: "RP Measure",
            display: "select",
            values: measures_blank,
            order: 4
        };
        options["reflectionPoint2Measure"] =
        {
            section: "Y-Axis",
            type: "string",
            label: "Additional RP (Optional)",
            display: "select",
            values: measures_blank,
            order: 5
        };
        options["border"] =
        {
            section: "Labels",
            type: "boolean",
            label: "Show Column Group Label Border",
            order: 1
        };
        options["borderBoxColor"] =
        {
            section: "Labels",
            type: "array",
            label: "Column Group Label Border Color",
            display: "color",
            default: "coral",
            order: 2
        };
        options["groupLabelFontSize"] =
        {
            section: "Labels",
            type: "string",
            label: "Group Label Font Size",
            placeholder: "20px",
            default: "20px",
            order: 3
        };
        options["labelFontSize"] =
        {
            section: "Labels",
            type: "string",
            label: "Label Font Size",
            placeholder: "12px",
            default: "12px",
            order: 4
        };
        options["decimalPrecision"] =
        {
            section: "Labels",
            type: "number",
            display: "number",
            label: "Decimal Precision",
            default: 0,
            order: 5
        };
        options["series1LegendColor"] =
        {
            section: "Labels",
            type: "array",
            label: "RP 1 Legend Color",
            display: "color",
            order: 6
        };
        options["series2LegendColor"] =
        {
            section: "Labels",
            type: "array",
            label: "RP 2 Legend Color",
            display: "color",
            order: 7
        };
        options["customSeriesColors"] =
        {
            section: "Colors",
            type: "boolean",
            label: "Custom Colors",
            order: 1
        };
        options["baselineColor"] =
        {
            section: "Colors",
            type: "array",
            label: "Custom Baseline Color",
            display: "color",
            default: "#2B333F",
            order: 2
        };
        options["baselineLabelColor"] =
        {
            section: "Colors",
            type: "array",
            label: "Custom Baseline Label Color",
            display: "color",
            default: "#FFFFFF",
            order: 3
        };
        options["firstRPColor"] =
        {
            section: "Colors",
            type: "array",
            label: "Custom First RP Color",
            display: "color",
            default: "#2B333F",
            order: 4
        };
        options["firstRPLabelColor"] =
        {
            section: "Colors",
            type: "array",
            label: "Custom First RP Label Color",
            display: "color",
            default: "#FFFFFF",
            order: 5
        };
        options["secondRPColor"] =
        {
            section: "Colors",
            type: "array",
            label: "Custom Second RP Color",
            display: "color",
            default: "#2B333F",
            order: 6
        };
        options["secondRPLabelColor"] =
        {
            section: "Colors",
            type: "array",
            label: "Custom Second RP Label Color",
            display: "color",
            default: "#FFFFFF",
            order: 7
        };

        this.trigger('registerOptions', options); // register options with parent page to update visConfig

        if (!config.domain) {
            done();
            return;
        }

        chartOptions.title = config.title;
        chartOptions.subtitle = config.subtitle;
        chartOptions.xAxis.labels.style.fontSize = config.labelFontSize;

        let xCategories: Array<string> = [];
        let baselineSeriesValues: Array<any> = [];
        let benchmarkSeriesValues: Array<any> = [];
        let reflectionPoint1SeriesValues: Array<any> = [];
        let reflectionPoint2SeriesValues: Array<any> = [];
        let primaryLabelClasses: Array<string> = [];
       
        let showRP1:boolean = config.reflectionPoint1Measure && config.reflectionPoint1Measure.length > 0;
        let showRP2:boolean = config.reflectionPoint2Measure && config.reflectionPoint2Measure.length > 0;

        data.forEach(function (row, i) {        
            const baseline: number = rounder(row[config.baselineMeasure].value,config.decimalPrecision);
            const benchmark: number = rounder(row[config.benchmarkMeasure].value,config.decimalPrecision);
            const reflectionPoint1: number = showRP1 ? rounder(row[config.reflectionPoint1Measure].value,config.decimalPrecision) : 0;
            const reflectionPoint2: number = showRP2 ? rounder(row[config.reflectionPoint2Measure].value,config.decimalPrecision) : 0;
            const firstCategory: string = row[config.firstCategory].value;
            const domain: string = row[config.domain].value;
            const secondCategory: string = row[config.secondCategory].value;

            let baselineColor: string;
            let baselineLabelColor: string;
            if (config.customSeriesColors) {
                baselineColor = config.baselineColor[0];
                baselineLabelColor = config.baselineLabelColor[0];
            }
            else if (showRP1 || showRP2) {
                baselineColor = "#98a4b7";
                baselineLabelColor = "#FFFFFF";
            }
            else {
                baselineColor = lookupColor(domain);
                baselineLabelColor = lookupLabelColor(domain, true, false);
            }

            let firstRPColor: string;
            let firstRPLabelColor: string;
            if (config.customSeriesColors) {
                firstRPColor = config.firstRPColor[0];
                firstRPLabelColor = config.firstRPLabelColor[0];
            }
            else if (showRP2) {
                firstRPColor = lookupSecondaryColor(domain);
                firstRPLabelColor = lookupLabelColor(domain, true, true);
            }
            else {
                firstRPColor = lookupColor(domain);
                firstRPLabelColor = lookupLabelColor(domain, true, false);
            }

            let secondRPColor: string;
            let secondRPLabelColor: string;
            if (config.customSeriesColors) {
                secondRPColor = config.secondRPColor[0];
                secondRPLabelColor = config.secondRPLabelColor[0];
            }
            else {
                secondRPColor = lookupColor(domain);
                secondRPLabelColor = lookupLabelColor(domain, false, true);
            }

            xCategories.push(secondCategory);

            baselineSeriesValues.push(
                { x: i, y: baseline
                    , color: baselineColor
                    , dataLabels: {color: baselineLabelColor}
                }
            );

            benchmarkSeriesValues.push(
                [i, rounder(benchmark,config.decimalPrecision)]
            );

            if (showRP1) {
                reflectionPoint1SeriesValues.push(
                    { x: i, y: reflectionPoint1
                        , color: firstRPColor
                        , dataLabels: {color: firstRPLabelColor}
                    }
                );
            }

            if (showRP2) {
                reflectionPoint2SeriesValues.push(
                    { x: i, y: reflectionPoint2
                        , color: secondRPColor
                        , dataLabels: {color: secondRPLabelColor}
                    }
                );
            }

            primaryLabelClasses.push(firstCategory.replace(/\s/g, '_'));
        });

        let baselineSeries : any = {};
        baselineSeries.name = "Baseline";
        if (showRP1 || showRP2) {
            baselineSeries.color = "#98A4B7";
        }
        else {
            baselineSeries.color = lookupColor(data[0][config.domain].value);
        }
        baselineSeries.dataLabels = {
                            enabled: true,
                            inside: true,
                            verticalAlign: 'top',
                            style: {
                                textOutline: 'none'
                            }
                        };
        baselineSeries.data = baselineSeriesValues;

        let numberOfClasses: number = primaryLabelClasses.length;
        
        let benchmarkSeries : any = {};
        benchmarkSeries.name = "Benchmark";
        benchmarkSeries.type = "scatter";
        benchmarkSeries.marker = {width: 0.7*totalWidth/numberOfClasses,
              height: 25,
              symbol: `url(${config.benchmarkIcon})`};
        benchmarkSeries.data = benchmarkSeriesValues ;

        let reflectionPoint1Series : any = {};

        let rp1Colors = new Set(reflectionPoint1SeriesValues.map(x => x.color));

        if (showRP1) {
            reflectionPoint1Series.name = 
                showRP2 ? 'Reflection Point 1' : 'Reflection Point'; 
            reflectionPoint1Series.data = reflectionPoint1SeriesValues;
            if (rp1Colors.size == 1 && `${config.series1LegendColor}` == "") {
                reflectionPoint1Series.color = rp1Colors.values().next().value;
            }
            else {
                reflectionPoint1Series.color = `${config.series1LegendColor}`;
            }

            reflectionPoint1Series.dataLabels = {
                enabled: true,
                inside: true,
                verticalAlign: 'top',
                style: {
                    textOutline: 'none'
                }
            };

        }
        let reflectionPoint2Series : any = {};

        let rp2Colors = new Set(reflectionPoint2SeriesValues.map(x => x.color));

        if (showRP1 && showRP2) {
            reflectionPoint2Series.name = 'Reflection Point 2';
            reflectionPoint2Series.data = reflectionPoint2SeriesValues;
            if (rp1Colors.size == 1 && `${config.series2LegendColor}` == "") {
                reflectionPoint2Series.color = rp2Colors.values().next().value;
            }
            else {
                reflectionPoint2Series.color = `${config.series2LegendColor}`;
            }

            reflectionPoint2Series.dataLabels = {
                enabled: true,
                inside: true,
                verticalAlign: 'top',
                style: {
                    textOutline: 'none'
                }
            };
        }
       

        chartOptions = baseChartOptions;
        chartOptions.xAxis.categories =  xCategories;
        if (showRP2 && showRP1) {
            chartOptions.series = [baselineSeries, reflectionPoint1Series, reflectionPoint2Series, benchmarkSeries];
        } else if (showRP1) {
            chartOptions.series = [baselineSeries, reflectionPoint1Series, benchmarkSeries];
        } else {
            chartOptions.series = [baselineSeries, benchmarkSeries];
        }
        var vizDiv = document.createElement('div');
        vizDiv.setAttribute('id','viz');
        element.appendChild(vizDiv);
        let vizDivRef = document.getElementById('viz')
        Highcharts.chart(vizDivRef, chartOptions);

        // Highcharts is all done, now the custom label boxes!

        let labelDivs: Array<Element> = []; 

        let uniquePrimaryLabelClasses: Array<string> = [...new Set(primaryLabelClasses)]; 
        let leftMargin: number = 100;
        let widthIncrement = (totalWidth - leftMargin)/numberOfClasses; 
        let styles: string = '';

        uniquePrimaryLabelClasses.forEach( (className:string, i: number) => {
            let numberOfElements: number = primaryLabelClasses.filter(x => x==className).length;
            let width = widthIncrement*numberOfElements;
            width = width -10;
            
            let newLabelElement = document.createElement('div');
            newLabelElement.setAttribute("id",className);
            let domainName = getDomainNameFromPrimaryLabel(className,config,data).trim();
            let labelValue = className.replace('_',' ').trim();
            if (domainName != labelValue) {
                labelValue = labelValue.replace(domainName,'').trim();
            } 
            newLabelElement.innerHTML = labelValue;
            let borderStyle = config.border ? `2px solid ${config.borderBoxColor}` : 'none';
            styles += `#${className} {
                width: ${width}px;
                text-align: center;
                font-size: ${config.groupLabelFontSize};
                position: inherit;
                border: ${borderStyle};
                border-radius: 4px;
                padding: 15px;
                margin-left:${i==0?"35px":"10px"};
                margin-right:${i==numberOfClasses?"10px":""};
                color:${lookupColor(domainName)};
            }
            `;
            labelDivs.push(newLabelElement);
        })
        
        var styleEl = document.createElement('style');
        styleEl.setAttribute('type',"text/css");
        styles +=  `
        @font-face {font-family: "Gilroy"; src: url("//db.onlinewebfonts.com/t/1dc8ecd8056a5ea7aa7de1db42b5b639.eot"); src: url("//db.onlinewebfonts.com/t/1dc8ecd8056a5ea7aa7de1db42b5b639.eot?#iefix") format("embedded-opentype"), url("//db.onlinewebfonts.com/t/1dc8ecd8056a5ea7aa7de1db42b5b639.woff2") format("woff2"), url("//db.onlinewebfonts.com/t/1dc8ecd8056a5ea7aa7de1db42b5b639.woff") format("woff"), url("//db.onlinewebfonts.com/t/1dc8ecd8056a5ea7aa7de1db42b5b639.ttf") format("truetype"), url("//db.onlinewebfonts.com/t/1dc8ecd8056a5ea7aa7de1db42b5b639.svg#Gilroy") format("svg"); }  
        div {
            font-family: "Gilroy"
        }
        `;
        styleEl.innerHTML = styles;
        document.head.appendChild(styleEl);

        var customLabelsDiv: Element = document.createElement('div');
        customLabelsDiv.setAttribute('class', 'customLabels');
        customLabelsDiv.setAttribute('style',"display: flex");
        labelDivs.forEach(x => customLabelsDiv.appendChild(x));
        element.appendChild(customLabelsDiv);
       
        done();
    }
    
};

function lookupLabelColor(domainName: string, isRP1: boolean, showRP2: boolean):string {
    if (domainName.trim().toLowerCase() == "mindset") {
        return "#3E4857";
    }
    else if (isRP1 && showRP2) {
        return "#3E4857";
    }
    else {
        return "#FFFFFF";
    }
}

looker.plugins.visualizations.add(vis);
