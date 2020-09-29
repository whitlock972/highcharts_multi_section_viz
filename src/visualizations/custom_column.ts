import { Looker, VisualizationDefinition, LookerChartUtils } from '../common/types';
import { handleErrors, formatType } from '../common/utils';
import './custom_column.css';
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
        text: 'Monthly Average Temperature'
    },
    subtitle: {
        text: ''
    },
    xAxis: {
        categories: []
    },
    yAxis: {
        title: null,
        max: 80,
        min: 30,
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
    id: 'custom-column', // id/label not required, but nice for testing and keeping manifests in sync
    label: 'custom-column',
    options: {
        title: {
            type: 'string',
            label: 'Title',
            placeholder: 'Custom Column Chart'
        },
        subtitle: {
            type: 'string',
            label: 'Subtitle'
        }
    },
    // Set up the initial state of the visualization
    create(element, config) {
 

        element.innerHTML = "Rendering ..."
        // chart = Highcharts.stockChart(element, chartOptions);
    },
    // Render in response to the data or settings changing
    updateAsync(data, element, config, queryResponse, details, done) {

        element.innerHTML = '';
        let totalWidth: number = document.body.clientWidth;
        const errors = handleErrors(this, queryResponse, {
            // min_pivots: 0,
            max_pivots: 0,
            min_dimensions: 2,
            max_dimensions: 3,
            min_measures: 3,
            max_measures: 5
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
            values: dimensions
        }
        options["firstCategory"] =
        {
            section: "X-Axis",
            type: "string",
            label: "First Category; Dimension or Domain",
            display: "select",
            values: dimensions
        }
        options["secondCategory"] =
        {
            section: "X-Axis",
            type: "string",
            label: "Second Category; Dimension or Sub-Dimension",
            display: "select",
            values: dimensions,
        }
        options["benchmarkMeasure"] =
        {
            section: "Y-Axis",
            type: "string",
            label: "Industry Benchmark",
            display: "select",
            values: measures,
        }
        options["baselineMeasure"] =
        {
            section: "Y-Axis",
            type: "string",
            label: "Baseline",
            display: "select",
            values: measures,
        }
        options["reflectionPoint1Measure"] =
        {
            section: "Y-Axis",
            type: "string",
            label: "RP",
            display: "select",
            values: measures,
        }
        options["secondaryMeasure"] =
        {
            section: "Y-Axis",
            type: "string",
            label: "Additional RP (Optional)",
            display: "select",
            values: measures,
        }
        options["title"] =
        {
            section: "Labels",
            type: "string",
            label: "Title",
            placeholder: "Column Chart"
        }
        options["subtitle"] =
        {
            section: "Labels",
            type: "string",
            label: "Subtitle"
        }
        options["decimalPrecision"] =
        {
            section: "Labels",
            type: "number",
            display: "number",
            label: "Decimal Precision",
            default: 0
        }
        options["borderBoxColor"] =
        {
            section: "Labels",
            type: "array",
            label: "Border Box Color",
            display: "color",
            default: "coral"
        }
        options["borderFontSize"] =
        {
            section: "Labels",
            type: "string",
            label: "Font Size",
            placeholder: "16px",
            default: "16px"
        }
        options["benchmarkIcon"] = {
            section: "Y-Axis",
            type: "string",
            label: "Benchmark Point Icon URL",
            default: 'https://freesvg.org/img/line-drawn.png'
        }


        this.trigger('registerOptions', options) // register options with parent page to update visConfig

        chartOptions.title = config.title
        chartOptions.subtitle = config.subtitle

        let xCategories: Array<string> = [];
        let baselineSeriesValues: Array<any> = [];
        let benchmarkSeriesValues: Array<any> = [];
        let reflectionPoint1SeriesValues: Array<any> = [];
        let primaryLabelClasses: Array<string> = [];
        let orderedData = orderByDomain(data, config);

        orderedData.forEach(function (row, i) {        
            var baselineMeasureCell = row[config.baselineMeasure];
            var benchmarkMeasureCell = row[config.benchmarkMeasure];
            var reflectionPoint1Cell = row[config.reflectionPoint1Measure];
            var firstCategoryCell = row[config.firstCategory];
            var domainCell = row[config.domain];
            var secondCategoryCell = row[config.secondCategory];
            var color = lookupColor(domainCell.value); 
            xCategories.push(
                secondCategoryCell.value
            )
            baselineSeriesValues.push(
                [ i, rounder(baselineMeasureCell.value,config.decimalPrecision)]
            )
            benchmarkSeriesValues.push(
                [i, rounder(benchmarkMeasureCell.value,config.decimalPrecision)]
            )
            reflectionPoint1SeriesValues.push(
                { x: i, y: rounder(reflectionPoint1Cell.value,config.decimalPrecision)
                    , color: color
                    , className: firstCategoryCell.value.replace(/\s/g, '')
                }
            )
            primaryLabelClasses.push(firstCategoryCell.value.replace(/\s/g, ''))
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
        reflectionPoint1Series.name = 'Reflection Point'
        reflectionPoint1Series.data = reflectionPoint1SeriesValues
        reflectionPoint1Series.dataLabels = {
            enabled: true,
            inside: true,
            verticalAlign: 'top',
            style: {
                textOutline: 'none'
            }
        }

        chartOptions = baseChartOptions
        chartOptions.xAxis.categories =  xCategories
        chartOptions.series = [baselineSeries, reflectionPoint1Series, benchmarkSeries]

        var vizDiv = document.createElement('div');
        vizDiv.setAttribute('id','viz');
        element.appendChild(vizDiv);
        let vizDivRef = document.getElementById('viz')
        Highcharts.chart(vizDivRef, chartOptions);

        
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
            newLabelElement.innerHTML = className
            styles += `#${className} {
                width: ${width}px;
                text-size: ${config.borderFontSize};
                position: inherit;
                border: 2px solid ${config.borderBoxColor};
                border-radius: 4px;
                padding: 15px;
                margin-left:${i==0?"35px":"10px"};
                margin-right:${i==numberOfClasses?"10px":""};
                color:${getColorFromPrimaryLabel(className,config,data)};
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
        default: color = "#FFFFFF"
    }
    return color
}

function domainOrder(domainName: string): string {
    switch (domainName.trim().toLowerCase()) {
        case "mindset" : return '1'
        case "inspiring" : return '2' 
        case "thriving" : return '3'
        case "outcome" : return '4'
        default: return 'domainName'
    }
}

function orderByDomain(dataArray:any, config:any): any {
    let newArray: any = dataArray
    newArray.sort(function(a: any, b: any){
        let cell:any = a[config.domain];
        if(domainOrder(cell.value) != domainOrder(b[config.domain].value))
            { return domainOrder(a[config.domain].value) > domainOrder(b[config.domain].value) }
        if(a[config.firstCategory].value != b[config.firstCategory].value)
            { return a[config.firstCategory].value > b[config.firstCategory].value }
        return a[config.secondCategory].value > b[config.secondCategory].value
    });
    return newArray
}

function rounder(float:number, digits:number): number {
    let rounded = Math.round(float * 10**digits) / 10**digits
    return rounded
}

function getColorFromPrimaryLabel(className:string,config:any,data:any):string {
    let color:string = ""
    if(config.firstCategory == config.domain) {
        color = lookupColor(className)
    }
    else {
        let domainName = data[0][config.domain].value
        color = lookupColor(domainName)
    }
    return color;
}

looker.plugins.visualizations.add(vis);