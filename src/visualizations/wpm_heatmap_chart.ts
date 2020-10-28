import { Looker, VisualizationDefinition, LookerChartUtils } from '../common/types'
import { handleErrors, formatType } from '../common/utils'

// import * as Highcharts1 from 'highcharts'

var Highcharts = require('highcharts');  
// Load module after Highcharts is loaded
require('highcharts/modules/heatmap')(Highcharts);

import { stockChart }  from 'highcharts/highstock'
import { Chart, Options, charts, XAxisOptions, SeriesOptionsType, SeriesColumnOptions } from 'highcharts'

declare var looker: Looker
let chart: Chart
let chartOptions: any
chartOptions = {
    chart: {
        type: 'heatmap',
        marginTop: 40,
        marginBottom: 80,
        plotBorderWidth: 0,
        plotBorderColor: 'white'
      },
    credits: {
        enabled: false
    },
    title: {
        floating:true,
        text:''
    },
    xAxis: {
        categories: [],
        labels: {
            autoRotation: false,
            style: {
                fontSize: '8px'
            }
        }
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
    colorAxis: {
        min: 30,
        max: 70,
        stops: [[0,'#263279'],[0.5,'#D9DDDE'],[1,'#670D23']],    
        reversed: false
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
            return this.point.value
            // If not null, use the default formatter
            return tooltip.defaultFormatter.call(this, tooltip);
        }
    }
}
let baseChartOptions = chartOptions

interface CustomColumnViz extends VisualizationDefinition {
    elementRef?: HTMLDivElement,
}

const vis: CustomColumnViz = {
    id: 'custom-heatmap', // id/label not required, but nice for testing and keeping manifests in sync
    label: 'custom-heatmap',
    options: {},
    // Set up the initial state of the visualization
    create(element, config) {
        element.innerHTML = "Rendering ..."
        // chart = Highcharts.stockChart(element, chartOptions)
    },
    // Render in response to the data or settings changing
    async updateAsync(data, element, config, queryResponse, details, done) {

        element.innerHTML = ''
        if (config.maxWidth && config.maxWidth > 0) element.style.width = `${config.maxWidth}px`; 

        const errors = handleErrors(this, queryResponse, {
            min_pivots: 1,
            max_pivots: 3,
            min_dimensions: 2,
            max_dimensions: 4,
            min_measures: 1,
            max_measures: 1
        })

        let measuresName = queryResponse.fields.measure_like[0].name

        let dimensions = queryResponse.fields.dimension_like.map((field) => {
            let key = field.label
            let value = field.name
            return { [key]: value }
        })
        let options = this.options
        options["domain"] =
        {
            section: "Lower Labels",
            type: "string",
            label: "Domain",
            display: "select",
            values: dimensions
        }
        options["firstCategory"] =
        {
            section: "Values",
            type: "string",
            label: "First Category: a Dimension or Domain",
            display: "select",
            values: dimensions
        }
        options["secondCategory"] =
        {
            section: "Values",
            type: "string",
            label: "Second Category: a Dimension or Sub-Dimension",
            display: "select",
            values: dimensions,
        }
        options["showLowerLabels"] =
        {
            section: "Lower Labels",
            type: "boolean",
            label: "Show Lower Labels"
        }
        options["border"] =
        {
            section: "Lower Labels",
            type: "boolean",
            label: "Draw border"
        }
        options["lowerLabelFontColor"] =
        {
            section: "Lower Labels",
            type: "array",
            label: "Font Color",
            display: "color"
        }
        options["borderBoxColor"] =
        {
            section: "Lower Labels",
            type: "array",
            label: "Border Box Color",
            display: "color"
        }
        options["borderFontSize"] =
        {
            section: "Lower Labels",
            type: "string",
            label: "Font Size",
            placeholder: "16px",
            default: "16px"
        }
        options["decimalPrecision"] =
        {
            section: "Values",
            type: "number",
            display: "number",
            label: "Decimal Precision",
            default: 0
        }
        options["xAxisFontSize"] =
        {
            section: "Axes",
            type: "number",
            display: "number",
            label: "X Axis Font Size",
            default: "8"
        }
        options["yAxisFontSize"] =
        {
            section: "Axes",
            type: "number",
            display: "number",
            label: "Y Axis Font Size",
            default: "12"
        }
        options["xAxisRotation"] =
        {
            section: "Axes",
            type: "boolean",
            label: "X Axis Rotation"
        }
        options["maxWidth"] =
        {
            section: "Axes",
            type: "number",
            display: "number",
            label: "Maximum Width (in pixels)"
        }
        options["minColor"] =
        {
            section: "Colors",
            type: "array",
            label: "Minimum Value Color",
            display: "color",
            default: "#263279"
        }
       
        options["midColor"] =
        {
            section: "Colors",
            type: "array",
            label: "Median Value Color",
            display: "color",
            default: "#D9DDDE"
        }
        options["maxColor"] =
        {
            section: "Colors",
            type: "array",
            label: "Maximum Value Color",
            display: "color",
            default: "#670D23"
        }
        options["minValue"] =
        {
            section: "Values",
            type: "number",
            display: "number",
            label: "Minimum Value",
            default: 30
        }
        options["maxValue"] =
        {
            section: "Values",
            type: "number",
            display: "number",
            label: "Maximum Value",
            default: 70
        }
        options["showCellLabels"] = 
        {
            section: "Values",
            type: "boolean",
            label: "Show Cell Labels"
        }

        this.trigger('registerOptions', options) // register options with parent page to update visConfig

        if (!config.domain) {
            done()
            return
        }

        let xCategories: Array<string> = []
        let seriesData: Array<any> = []
        let primaryLabelClasses: Array<string> = []
        let yCategories: Array<string> =  Object.keys(data[0][measuresName]).map(x =>getFinalSectionOfPipedString(x))
        let dataValues: any = Object.values(data[0][measuresName])

        let maxYAxisStringLength: number = Math.max(...yCategories.map(x=>x.length))
        let totalWidth: number = document.body.clientWidth
        
        await data.forEach(function (row, i) {        
            var firstCategoryCell = row[config.firstCategory]
            var domainCell = row[config.domain]
            var secondCategoryCell = row[config.secondCategory]
            var secondRPcolor = lookupColor(domainCell.value)
            var values = Object.values(data[i][measuresName])
            
            values.map((x:any,j:number)=> {
            //     element.innerHTML = `i:${i},j:${j}, value: ${JSON.stringify(x)}` + ' ----+------' + JSON.stringify(values) + '--------' + JSON.stringify(data, null, '\n')
            // return;
                seriesData.push([i,j,rounder(x.value,config.decimalPrecision)])
            })
            
            xCategories.push(
                secondCategoryCell.value 
            )
            primaryLabelClasses.push(firstCategoryCell.value.replace(/\s/g, '_'))
        })

       
        
        let numberOfClasses: number = primaryLabelClasses.length
        

        let pivotedSeries: any = {}
            pivotedSeries.data = seriesData 
            pivotedSeries.borderWidth= 0
            pivotedSeries.borderColor= 'white'
        
        if (config.showCellLabels) {
            pivotedSeries.dataLabels= {
                enabled: true,
                style: {
                    textOutline: 'none'
                }
            }
        }   
        
   
        chartOptions = baseChartOptions
        chartOptions.xAxis.categories =  xCategories
        chartOptions.yAxis.categories =  yCategories
        chartOptions.xAxis.labels.style.fontSize = `${config.xAxisFontSize}px` 
        chartOptions.yAxis.labels.style.fontSize = `${config.yAxisFontSize}px`
        
        if (config.xAxisRotation) {
            chartOptions.xAxis.labels.rotation = -90
        } else delete chartOptions.xAxis.labels.rotation

        let colorAxis:any = {
            min: config.minValue || 30,
            max: config.maxValue || 70,  
            stops: [
                [0,`${config.minColor}` || '#263279'],
                [0.5,`${config.midColor}` || '#D9DDDE'],
                [1,`${config.maxColor}` || '#670D23']],
            reversed: false
          }
        
        chartOptions.colorAxis = colorAxis;

        chartOptions.series = [pivotedSeries]    
      
        var vizDiv = document.createElement('div')
        vizDiv.setAttribute('id','viz')
        element.appendChild(vizDiv)
        let vizDivRef = document.getElementById('viz')
        Highcharts.chart(vizDivRef, chartOptions)

        // Highcharts is all done, now the custom label boxes!

        let labelDivs: Array<Element> = [] 

        let uniquePrimaryLabelClasses: Array<string> = [...new Set(primaryLabelClasses)] 
        let leftMargin: number = maxYAxisStringLength * (config.yAxisFontSize/2) + 27
        let rightMargin: number = 65
        let widthIncrement = (totalWidth - leftMargin - rightMargin)/numberOfClasses    
        let styles: string = ''

        chartOptions.xAxis.labels.width = `${widthIncrement}px`

        uniquePrimaryLabelClasses.forEach( (className:string, i: number) => {
            let numberOfElements: number = primaryLabelClasses.filter(x => x==className).length
            let width = widthIncrement*numberOfElements - 10
            
            let newLabelElement = document.createElement('div')
            newLabelElement.setAttribute("id",className)
            let domainName = getDomainNameFromPrimaryLabel(className,config,data).trim()
            let labelValue = className.replace('_',' ').trim()
            if (domainName != labelValue) { labelValue = labelValue.replace(domainName,'').trim() } 
            newLabelElement.innerHTML = labelValue
            let borderStyle = config.border ? `2px solid ${config.borderBoxColor}` : 'none'
            styles += `#${className} {
                width: ${width}px;
                text-align: center;
                font-size: ${config.borderFontSize};
                position: inherit;
                border: ${borderStyle};
                border-radius: 4px;
                padding: 15px;
                margin-left:${i==0?`${leftMargin}px`:"10px"};
                margin-right:${i+1==uniquePrimaryLabelClasses.length?`${rightMargin}px`:""};
                color:${config.lowerLabelFontColor || lookupColor(domainName)};
            }
            `
            labelDivs.push(newLabelElement)
        })
        

        var styleEl = document.createElement('style')
        styleEl.setAttribute('type',"text/css")
        styles +=  `
        @font-face {font-family: "Gilroy"; src: url("//db.onlinewebfonts.com/t/1dc8ecd8056a5ea7aa7de1db42b5b639.eot"); src: url("//db.onlinewebfonts.com/t/1dc8ecd8056a5ea7aa7de1db42b5b639.eot?#iefix") format("embedded-opentype"), url("//db.onlinewebfonts.com/t/1dc8ecd8056a5ea7aa7de1db42b5b639.woff2") format("woff2"), url("//db.onlinewebfonts.com/t/1dc8ecd8056a5ea7aa7de1db42b5b639.woff") format("woff"), url("//db.onlinewebfonts.com/t/1dc8ecd8056a5ea7aa7de1db42b5b639.ttf") format("truetype"), url("//db.onlinewebfonts.com/t/1dc8ecd8056a5ea7aa7de1db42b5b639.svg#Gilroy") format("svg"); }  
        div {
            font-family: "Gilroy", Arial, Helevatica, sans-serif;
        }
        `
        styleEl.innerHTML = styles 
        document.head.appendChild(styleEl)

        var customLabelsDiv: Element = document.createElement('div')
        customLabelsDiv.setAttribute('class', 'customLabels')
        customLabelsDiv.setAttribute('style',"display: flex")
        labelDivs.forEach(x => customLabelsDiv.appendChild(x))
        
        if(config.showLowerLabels) {element.appendChild(customLabelsDiv)}
       
        done()
    }
    
}

function lookupColor(domainName: string): string {
    let color: string 
    switch (domainName.trim().toLowerCase()) {
        case "mindset" : color = "#FFD116"
        break
        case "inspiring" : color = "#39A6FF" 
        break
        case "thriving" : color = "#FF6A4C"
        break
        case "outcome" : color = "#41B2A2"
        break
        case "outcomes" : color = "#41B2A2"
        break
        default: color = "#2B333F"
    }
    return color
}

function lookupSecondaryColor(domainName: string):string {
    let color: string 
    switch (domainName.trim().toLowerCase()) {
        case "mindset" : color = "#FFEEB2"
        break
        case "inspiring" : color = "#BBDFFF" 
        break
        case "thriving" : color = "#FECCBC"
        break
        case "outcome" : color = "#A9DED7"
        break
        case "outcomes" : color = "#A9DED7"
        break
        default: color = "#FFFFFF"
    }
return color
}



function rounder(float:number, digits:number): number {
    let rounded = Math.round(float * 10**digits) / 10**digits
    return rounded
}

function getFinalSectionOfPipedString(input:string):string {
    let finalString:string = ''
    let array:Array<string> = input.split('|')
    finalString = array[array.length-1]
    return finalString
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

looker.plugins.visualizations.add(vis)