import {
    VisConfig,
    VisQueryResponse,
    VisualizationDefinition
} from './types'
import Highcharts = require('highcharts');

export const formatType = (valueFormat: string, value: any): number => {
    if (!value || !valueFormat) return null;
    switch (valueFormat) {
        case 'date_time':
        case 'date_date':
        case 'date_month':
        case 'date_quarter':
        case 'date_week':
        case 'date_year':
            return new Date(value).valueOf();
        default:
            return parseInt(value);

    }
}

export enum xAxisLevels {
    Hours,
    Days,
    Months,
    Years
};

export const xAxisMap = {
    [xAxisLevels.Hours]: [{
        type: "datetime",
        startOnTick: true,
        minorTicks: true,
        labels: {
            enabled: true,
            formatter: function () {
                return Highcharts.dateFormat('%e %K:%l %p', this.value);
            },
            units: [
                ['minute', [1, 2, 5, 10, 15, 30]],
                ['hour', [1, 2, 3, 4, 5, 6, 8 , 12, 24]],
                ['day', [1, 2, 3, 4, 5, 6]]
            ],
            title: {
                text: null
            }
        },
        showLastLabel: true,
    }],
    [xAxisLevels.Days]: [{
        type: "datetime",
        startOnTick: true,
        labels: {
            enabled: true,
            formatter: function () {
                return Highcharts.dateFormat('%b %e %H', this.value);
            },
            units: [
                ['hour', [1, 2, 3, 4, 5, 6, 8 , 12, 24]],
                ['day', [1, 2, 3, 4, 5, 8, 12, 20, 30, 31]],
                ['month', [1, 2, 3, 4]]
            ],
            title: {
                text: null
            }
        }
    }],
    [xAxisLevels.Months]: [{
        type: "datetime",
        startOnTick: true,
        labels: {
            enabled: true,
            formatter: function () {
                return Highcharts.dateFormat('%e', this.value);
            }
        },
        units: [
            ['minute', [1, 2, 5, 10, 15, 30]],
            ['hour', [1, 2, 3, 4, 6, 8, 12, 24]],
            ['day', [1, 2, 3, 4, 5, 6, 10, 15, 20, 30, 31]],
        ],
        title: {
            text: null
        },
    },
    {
        type: "datetime",
        startOnTick: true,
        labels: {
            enabled: true,
            formatter: function () {
                return Highcharts.dateFormat('%Y %B', this.value);
            }
        },
        units: [
            ['month', [1]],
            ['year', [1]]
        ],
        title: {
            text: null
        },
        linkedTo: 0
    }],
    [xAxisLevels.Years]: [{
        type: "datetime",
        startOnTick: true,
        labels: {
            enabled: true,
            formatter: function () {
                return Highcharts.dateFormat('%e', this.value);
            }
        },
        units: [
            ['minute', [1, 2, 5, 10, 15, 30]],
            ['hour', [1, 2, 3, 4, 6, 8, 12, 24]],
            ['day', [1, 2, 3, 4, 5, 6]],
            ['month', [1, 3, 6]]
        ],
        title: {
            text: null
        },
    },
    {
        type: "datetime",
        startOnTick: true,
        labels: {
            enabled: true,
            formatter: function () {
                return Highcharts.dateFormat('%Y %B', this.value);
            }
        },
        units: [
            ['month', [1]],
            ['year', [1]]
        ],
        title: {
            text: null
        },
        linkedTo: 0
    }]
};

export const getTimeSeriesXAxis = (dateMax: number, dateMin: number): Highcharts.XAxisOptions[] => {
    const day = 24 * 60 * 60 * 1000; // hours * minutes * seconds * milliseconds

    const daysBetween = Math.round(Math.abs((dateMin - dateMax) / day));

    if (daysBetween < 5) { // hours is appropriate
        return xAxisMap[xAxisLevels.Hours] as Highcharts.XAxisOptions[];
    } else if (daysBetween < 30) { // days is appropriate
        return xAxisMap[xAxisLevels.Days] as Highcharts.XAxisOptions[];
    } else if (daysBetween < 90) { // months is appropriate
        return (xAxisMap[xAxisLevels.Months] as unknown) as Highcharts.XAxisOptions[];
    } else { // years is appropriate
        return (xAxisMap[xAxisLevels.Years] as unknown) as Highcharts.XAxisOptions[];
    }

}

export const handleErrors = (vis: VisualizationDefinition, res: VisQueryResponse, options: VisConfig) => {

    const check = (group: string, noun: string, count: number, min: number, max: number): boolean => {
        if (!vis.addError || !vis.clearErrors) return false
        if (count < min) {
            vis.addError({
                title: `Not Enough ${noun}s`,
                message: `This visualization requires ${min === max ? 'exactly' : 'at least'} ${min} ${noun.toLowerCase()}${ min === 1 ? '' : 's' }.`,
                group
            })
            return false
        }
        if (count > max) {
            vis.addError({
                title: `Too Many ${noun}s`,
                message: `This visualization requires ${min === max ? 'exactly' : 'no more than'} ${max} ${noun.toLowerCase()}${ min === 1 ? '' : 's' }.`,
                group
            })
            return false
        }
        vis.clearErrors(group)
        return true
    }

    const { pivots, dimensions, measure_like: measures } = res.fields

    return (check('pivot-req', 'Pivot', pivots.length, options.min_pivots, options.max_pivots)
        && check('dim-req', 'Dimension', dimensions.length, options.min_dimensions, options.max_dimensions)
        && check('mes-req', 'Measure', measures.length, options.min_measures, options.max_measures))
}