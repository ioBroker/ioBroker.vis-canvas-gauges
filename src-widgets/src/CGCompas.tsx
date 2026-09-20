import type { RxWidgetInfo } from '@iobroker/types-vis-2';

import GaugeBase, {
    type Defaults,
    groupAnimation,
    groupBorders,
    groupColorsGauge,
    groupColorsRadial,
    groupCommon,
    groupFonts,
    groupGaugeRadial,
    groupHighlights,
    groupNeedle,
    groupNeedleRadial,
    groupTicks,
    groupValueBox,
} from './Components/GaugeBase';
import type { CommonRxData, GaugeType } from './gaugeOptions';

/**
 * The defaults of `tplCGCompas` in `widgets/canvas-gauges.html`.
 *
 * A radial gauge over the full circle: the scale runs from 0 to 360, the major ticks are the directions and the
 * needle is a thin line on a dark plate.
 */
const DEFAULTS: Defaults = {
    minValue: 0,
    maxValue: 360,
    factor: 1,
    valueOffset: 0,
    hCount: 1,
    followTheme: true,
    majorTicks: 'N,NE,E,SE,S,SW,W,NW,N',
    minorTicks: 22,
    strokeTicks: false,
    animation: true,
    animationDuration: 1000,
    colorPlate: '#222',
    colorMajorTicks: '#f5f5f5',
    colorMinorTicks: '#ddd',
    colorNumbers: '#ccc',
    colorNeedle: 'rgba(240,128,128,1)',
    colorNeedleEnd: 'rgba(255,160,122,.9)',
    colorBorderOuter: '#ccc',
    colorBorderOuterEnd: '#ccc',
    colorNeedleShadowDown: '#222',
    needleType: 'line',
    needleStart: 75,
    needleEnd: 99,
    needleWidth: 3,
    borders: true,
    borderOuterWidth: 10,
    borderMiddleWidth: 0,
    borderInnerWidth: 0,
    borderShadowWidth: 0,
    valueBox: false,
    valueTextShadow: false,
    ticksAngle: 360,
    startAngle: 180,
    colorNeedleCircleOuter: '#ccc',
    needleCircleSize: 15,
    needleCircleOuter: false,
};

/** `tplCGCompas` - the compass rose (vis-1 name: "Compas"). A radial gauge with the eight directions as scale. */
export default class CGCompas extends GaugeBase<CommonRxData> {
    static getWidgetInfo(): RxWidgetInfo {
        return {
            id: 'tplCGCompas',
            visSet: 'canvas-gauges',
            visSetLabel: 'set_label',
            visName: 'Compas',
            visWidgetLabel: 'widget_compas',
            visHelp: 'help_compas',
            visAttrs: [
                groupCommon(DEFAULTS),
                groupHighlights(),
                groupTicks(DEFAULTS),
                groupAnimation(DEFAULTS, true),
                groupColorsGauge(DEFAULTS),
                groupNeedle(DEFAULTS),
                groupBorders(DEFAULTS),
                groupValueBox(DEFAULTS),
                groupFonts(DEFAULTS),
                groupGaugeRadial(DEFAULTS),
                groupColorsRadial(DEFAULTS),
                groupNeedleRadial(DEFAULTS),
            ],
            visDefaultStyle: {
                width: 200,
                height: 200,
                position: 'absolute',
            },
            visPrev: 'widgets/vis-2-widgets-canvas-gauges/img/prev_compas.svg',
        };
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo(): RxWidgetInfo {
        return CGCompas.getWidgetInfo();
    }

    // eslint-disable-next-line class-methods-use-this
    getGaugeType(): GaugeType {
        return 'radial';
    }
}
