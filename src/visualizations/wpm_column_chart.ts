import { Looker, VisualizationDefinition, LookerChartUtils } from '../common/types';
import { handleErrors, formatType } from '../common/utils';
import './wpm_column_chart.css';
import * as Highcharts1 from 'highcharts';
import { stockChart }  from 'highcharts/highstock';
import { Chart, Options, charts, XAxisOptions, SeriesOptionsType, SeriesColumnOptions } from 'highcharts';

declare var looker: Looker;
let chart: Chart;
let chartOptions: any;

let Highcharts:any = Highcharts1
chartOptions = {
    chart: {
        type: 'column'
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
                fontSize: '0.5rem'
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
            pointPadding: 0
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
 

        element.innerHTML = "Rendering ..."
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
            let key = field.label
            let value = field.name
            return { [key]: value }
        })
        let dimensions = queryResponse.fields.dimension_like.map((field) => {
            let key = field.label
            let value = field.name
            return { [key]: value }
        })
        let options = this.options;
        options["domain"] =
        {
            section: "X-Axis",
            type: "string",
            label: "Domain",
            display: "select",
            values: dimensions,
            order: 1
        }
        options["secondCategory"] =
        {
            section: "X-Axis",
            type: "string",
            label: "Column Label",
            display: "select",
            values: dimensions,
            order: 2
        }
        options["firstCategory"] =
        {
            section: "X-Axis",
            type: "string",
            label: "Column Group Label",
            display: "select",
            values: dimensions,
            order: 3
        }
        options["benchmarkMeasure"] =
        {
            section: "Y-Axis",
            type: "string",
            label: "Industry Benchmark",
            display: "select",
            values: measures,
            order: 1
        }
        options["benchmarkIcon"] = {
            section: "Y-Axis",
            type: "string",
            label: "Benchmark Point Icon URL",
            default: 'https://freesvg.org/img/line-drawn.png',
            order: 2
        }
        options["baselineMeasure"] =
        {
            section: "Y-Axis",
            type: "string",
            label: "Baseline",
            display: "select",
            values: measures,
            order: 3
        }
        options["reflectionPoint1Measure"] =
        {
            section: "Y-Axis",
            type: "string",
            label: "RP Measure",
            display: "select",
            values: measures,
            order: 4
        }
        options["reflectionPoint2Measure"] =
        {
            section: "Y-Axis",
            type: "string",
            label: "Additional RP (Optional)",
            display: "select",
            values: measures,
            order: 5
        }
        options["title"] =
        {
            section: "Labels",
            type: "string",
            label: "Title",
            placeholder: "Whole Person Model",
            order: 1
        }
        options["subtitle"] =
        {
            section: "Labels",
            type: "string",
            label: "Subtitle",
            order: 2
        }
        options["border"] =
        {
            section: "Labels",
            type: "boolean",
            label: "Show Column Group Label Border",
            order: 3
        }
        options["borderBoxColor"] =
        {
            section: "Labels",
            type: "array",
            label: "Column Group Label Border Color",
            display: "color",
            default: "coral",
            order: 4
        }
        options["borderFontSize"] =
        {
            section: "Labels",
            type: "string",
            label: "Font Size",
            placeholder: "16px",
            default: "16px",
            order: 5
        }
        options["decimalPrecision"] =
        {
            section: "Labels",
            type: "number",
            display: "number",
            label: "Decimal Precision",
            default: 0,
            order: 6
        }
        options["series1LegendColor"] =
        {
            section: "Labels",
            type: "array",
            label: "RP 1 Legend Color",
            display: "color",
            order: 7
        }
        options["series2LegendColor"] =
        {
            section: "Labels",
            type: "array",
            label: "RP 2 Legend Color",
            display: "color",
            order: 8
        }

        this.trigger('registerOptions', options) // register options with parent page to update visConfig

        if (!config.domain) {
            done();
            return;
        }

        chartOptions.title = config.title
        chartOptions.subtitle = config.subtitle

        let xCategories: Array<string> = [];
        let baselineSeriesValues: Array<any> = [];
        let benchmarkSeriesValues: Array<any> = [];
        let reflectionPoint1SeriesValues: Array<any> = [];
        let reflectionPoint2SeriesValues: Array<any> = [];
        let primaryLabelClasses: Array<string> = [];
       
        let showRP1:boolean = config.reflectionPoint1Measure && config.reflectionPoint1Measure.length > 0;
        let showRP2:boolean = config.reflectionPoint2Measure && config.reflectionPoint2Measure.length > 0;

        data.forEach(function (row, i) {        
            var baselineMeasureCell = row[config.baselineMeasure];
            var benchmarkMeasureCell = row[config.benchmarkMeasure];
            var firstCategoryCell = row[config.firstCategory];
            var domainCell = row[config.domain];
            var secondCategoryCell = row[config.secondCategory];
            var color = showRP2 ? lookupSecondaryColor(domainCell.value) : lookupColor(domainCell.value); 
            var secondRPcolor = lookupColor(domainCell.value);
            xCategories.push(
                secondCategoryCell.value
            )
            baselineSeriesValues.push(
                [ i, rounder(baselineMeasureCell.value,config.decimalPrecision)]
            )
            benchmarkSeriesValues.push(
                [i, rounder(benchmarkMeasureCell.value,config.decimalPrecision)]
            )
            if (showRP1) {
                var reflectionPoint1Cell = row[config.reflectionPoint1Measure];
                reflectionPoint1SeriesValues.push(
                    { x: i, y: rounder(reflectionPoint1Cell.value,config.decimalPrecision)
                        , color: color
                        , className: firstCategoryCell.value.replace(/\s/g, '_')
                    }
                )
            }
            if (showRP2) {
                var reflectionPoint2Cell = row[config.reflectionPoint2Measure];
                reflectionPoint2SeriesValues.push(
                    { x: i, y: rounder(reflectionPoint2Cell.value,config.decimalPrecision)
                        , color: secondRPcolor
                        , className: secondCategoryCell.value.replace(/\s/g, '_')
                    }
                )
            }

            primaryLabelClasses.push(firstCategoryCell.value.replace(/\s/g, '_'))
        });

        let baselineSeries : any = {};
        baselineSeries.name = "Baseline"
        baselineSeries.color = "#98A4B7"
        baselineSeries.dataLabels = {
                            enabled: true,
                            inside: true,
                            verticalAlign: 'top',
                            style: {
                                textOutline: 'none'
                            }
                        }
        baselineSeries.data = baselineSeriesValues

        let numberOfClasses: number = primaryLabelClasses.length;
        
        let benchmarkSeries : any = {};
        benchmarkSeries.name = "Benchmark"
        benchmarkSeries.type = "scatter";
        benchmarkSeries.marker = {width: 0.7*totalWidth/numberOfClasses,
              height: 25,
              symbol: `url(${config.benchmarkIcon})`}
        benchmarkSeries.data = benchmarkSeriesValues ;

        let reflectionPoint1Series : any = {};
        if (showRP1) {
            reflectionPoint1Series.name = 
                showRP2 ? 'Reflection Point 1' : 'Reflection Point'; 
            reflectionPoint1Series.data = reflectionPoint1SeriesValues
            reflectionPoint1Series.color = `${config.series1LegendColor}`

            reflectionPoint1Series.dataLabels = {
                enabled: true,
                inside: true,
                verticalAlign: 'top',
                style: {
                    textOutline: 'none'
                }
            }

        }
        let reflectionPoint2Series : any = {};
        if (showRP1 && showRP2) {
            reflectionPoint2Series.name = 'Reflection Point 2'
            reflectionPoint2Series.data = reflectionPoint2SeriesValues
            reflectionPoint2Series.color = `${config.series2LegendColor}`

            reflectionPoint2Series.dataLabels = {
                enabled: true,
                inside: true,
                verticalAlign: 'top',
                style: {
                    textOutline: 'none'
                }
            }
        }
       

        chartOptions = baseChartOptions
        chartOptions.xAxis.categories =  xCategories
        if (showRP2 && showRP1) {
            chartOptions.series = [baselineSeries, reflectionPoint1Series, reflectionPoint2Series, benchmarkSeries]
        } else if (showRP1) {
            chartOptions.series = [baselineSeries, reflectionPoint1Series, benchmarkSeries]
        } else {
            chartOptions.series = [baselineSeries, benchmarkSeries]    
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
        let widthIncrement = (totalWidth - leftMargin)/numberOfClasses    
        let styles: string = '';

        uniquePrimaryLabelClasses.forEach( (className:string, i: number) => {
            let numberOfElements: number = primaryLabelClasses.filter(x => x==className).length
            let width = widthIncrement*numberOfElements;
            width = width -10
            
            let newLabelElement = document.createElement('div')
            newLabelElement.setAttribute("id",className)
            let domainName = getDomainNameFromPrimaryLabel(className,config,data).trim();
            let labelValue = className.replace('_',' ').trim()
            if (domainName != labelValue) { labelValue = labelValue.replace(domainName,'').trim() } 
            newLabelElement.innerHTML = labelValue;
            let borderStyle = config.border ? `2px solid ${config.borderBoxColor}` : 'none';
            styles += `#${className} {
                width: ${width}px;
                text-align: center;
                text-size: ${config.borderFontSize};
                position: inherit;
                border: ${borderStyle};
                border-radius: 4px;
                padding: 15px;
                margin-left:${i==0?"35px":"10px"};
                margin-right:${i==numberOfClasses?"10px":""};
                color:${lookupColor(domainName)};
            }
            `
            labelDivs.push(newLabelElement)
        })
        

        var styleEl = document.createElement('style');
        styleEl.setAttribute('type',"text/css")
        styles +=  `
        @font-face {font-family: "Gilroy"; src: url("//db.onlinewebfonts.com/t/1dc8ecd8056a5ea7aa7de1db42b5b639.eot"); src: url("//db.onlinewebfonts.com/t/1dc8ecd8056a5ea7aa7de1db42b5b639.eot?#iefix") format("embedded-opentype"), url("//db.onlinewebfonts.com/t/1dc8ecd8056a5ea7aa7de1db42b5b639.woff2") format("woff2"), url("//db.onlinewebfonts.com/t/1dc8ecd8056a5ea7aa7de1db42b5b639.woff") format("woff"), url("//db.onlinewebfonts.com/t/1dc8ecd8056a5ea7aa7de1db42b5b639.ttf") format("truetype"), url("//db.onlinewebfonts.com/t/1dc8ecd8056a5ea7aa7de1db42b5b639.svg#Gilroy") format("svg"); }  
        div {
            font-family: "Gilroy"
        }
        `
        styleEl.innerHTML = styles 
        document.head.appendChild(styleEl);

        var customLabelsDiv: Element = document.createElement('div');
        customLabelsDiv.setAttribute('class', 'customLabels')
        customLabelsDiv.setAttribute('style',"display: flex")
        labelDivs.forEach(x => customLabelsDiv.appendChild(x))
        element.appendChild(customLabelsDiv);
       
        done();
    }
    
};

function lookupColor(domainName: string): string {
    let color: string ;
    switch (domainName.trim().toLowerCase()) {
        case "mindset" : color = "#FFD116"
        break;
        case "inspiring" : color = "#39A6FF" 
        break;
        case "thriving" : color = "#FF6A4C"
        break;
        case "outcome" : color = "#41B2A2"
        break;
        case "outcomes" : color = "#41B2A2"
        break;
        default: color = "#2B333F"
    }
    return color
}

function lookupSecondaryColor(domainName: string):string {
    let color: string ;
    switch (domainName.trim().toLowerCase()) {
        case "mindset" : color = "#FFEEB2"
        break;
        case "inspiring" : color = "#BBDFFF" 
        break;
        case "thriving" : color = "#FECCBC"
        break;
        case "outcome" : color = "#A9DED7"
        break;
        case "outcomes" : color = "#A9DED7"
        break;
        default: color = "#FFFFFF"
    }
return color;
}



function rounder(float:number, digits:number): number {
    let rounded = Math.round(float * 10**digits) / 10**digits
    return rounded
}

function getDomainNameFromPrimaryLabel(className:string,config:any,data:any):string {
    let domainName: string = '' 
    if(config.firstCategory == config.domain) {
        domainName = className
    }
    else {
        domainName = data[0][config.domain].value
    }
    return domainName
}

looker.plugins.visualizations.add(vis);