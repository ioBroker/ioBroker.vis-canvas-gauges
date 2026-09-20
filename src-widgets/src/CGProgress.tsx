import type { RxWidgetInfo } from '@iobroker/types-vis-2';

import GaugeBase, {
    type Defaults,
    groupAnimation,
    groupBorders,
    groupColorsBar,
    groupColorsGauge,
    groupCommon,
    groupFonts,
    groupGaugeBar,
    groupHighlights,
    groupNeedle,
    groupPositions,
    groupTicks,
    groupTicksBar,
    groupValueBox,
} from './Components/GaugeBase';
import type { CommonRxData, GaugeType } from './gaugeOptions';

/**
 * Defaults of the progress bar.
 *
 * Unlike the other four widgets this one has no counterpart in vis-1 - it is a linear gauge stripped down to the
 * bar: no plate, no rings, no needle and no scale, just the track and the part up to the value. That is the
 * shape people build by hand for a battery, a tank or a humidity, and it takes a dozen settings to get there, so
 * it is worth a preset of its own.
 *
 * The scale is not simply switched off - the library has no option for that - but made invisible: the ticks have
 * a width of 0 and the numbers a transparent colour. Setting a colour brings them back.
 *
 * The value box stays off, because the library draws it for a linear gauge only while it stands upright
 * (`barDimensions.isVertical`, which is `height >= width`). On a bar lying down it would simply do nothing.
 */
const DEFAULTS: Defaults = {
    minValue: 0,
    maxValue: 100,
    factor: 1,
    valueOffset: 0,
    hCount: 0,
    followTheme: true,

    majorTicks: 2,
    minorTicks: 0,
    strokeTicks: false,

    animation: true,
    animationDuration: 500,

    colorPlate: 'rgba(0,0,0,0)',
    colorNumbers: 'rgba(0,0,0,0)',

    needle: false,

    borders: false,
    borderOuterWidth: 0,
    borderMiddleWidth: 0,
    borderInnerWidth: 0,
    borderShadowWidth: 0,

    valueBox: false,

    barBeginCircle: 0,
    barWidth: 45,
    barLength: 95,
    barStrokeWidth: 0,
    barProgress: true,
    colorBar: '#e0e0e0',
    colorBarProgress: '#4b8bd6',

    tickSide: 'right',
    needleSide: 'right',
    numberSide: 'right',
    ticksWidth: 0,
    ticksWidthMinor: 0,
};

/**
 * `tplCGprogress` - the plain bar (vis-2 only).
 *
 * A linear gauge, so it turns with the widget: wider than tall it lies down, taller than wide it stands up.
 */
export default class CGProgress extends GaugeBase<CommonRxData> {
    static getWidgetInfo(): RxWidgetInfo {
        return {
            id: 'tplCGprogress',
            visSet: 'canvas-gauges',
            visSetLabel: 'set_label',
            visName: 'Progress',
            visWidgetLabel: 'widget_progress',
            visHelp: 'help_progress',
            visAttrs: [
                groupCommon(DEFAULTS),
                groupHighlights(),
                groupTicks(DEFAULTS),
                groupAnimation(DEFAULTS, false),
                groupColorsGauge(DEFAULTS),
                groupNeedle(DEFAULTS),
                groupBorders(DEFAULTS),
                groupValueBox(DEFAULTS),
                groupFonts(DEFAULTS),
                groupGaugeBar(DEFAULTS),
                groupColorsBar(DEFAULTS),
                groupPositions(DEFAULTS),
                groupTicksBar(DEFAULTS),
            ],
            visDefaultStyle: {
                width: 300,
                height: 60,
                position: 'absolute',
            },
            visPrev: 'widgets/vis-2-widgets-canvas-gauges/img/prev_progress.svg',
        };
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo(): RxWidgetInfo {
        return CGProgress.getWidgetInfo();
    }

    // eslint-disable-next-line class-methods-use-this
    getGaugeType(): GaugeType {
        return 'linear';
    }

    /*
     * The transparent plate and the invisible scale are the point of this widget: the view shows through in both
     * themes. The dark theme must not paint a plate under the bar.
     */
    // eslint-disable-next-line class-methods-use-this
    protected getThemeExceptions(): string[] {
        return ['colorPlate', 'colorNumbers'];
    }
}
