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
 * The defaults of `tplCGflatGauge` in `widgets/canvas-gauges.html`.
 *
 * A linear gauge lying on its side without any border: a white plate, the scale and the needle on the left and a
 * slim red bar - the "flat" look of canvas-gauges.
 */
const DEFAULTS: Defaults = {
    factor: 1,
    valueOffset: 0,
    hCount: 1,
    minorTicks: 10,
    strokeTicks: true,
    animation: true,
    colorPlate: '#fff',
    colorNeedle: 'red',
    colorNeedleEnd: 'rgba(255,0,0,0.7)',
    needleType: 'line',
    needleWidth: 3,
    borders: false,
    borderOuterWidth: 0,
    borderMiddleWidth: 0,
    borderInnerWidth: 0,
    borderShadowWidth: 0,
    valueBox: false,
    barBeginCircle: 0,
    barWidth: 5,
    barProgress: true,
    colorBarProgress: '#db9994',
    tickSide: 'left',
    needleSide: 'left',
    numberSide: 'left',
    ticksWidth: 50,
    ticksWidthMinor: 15,
};

/** `tplCGflatGauge` - the wide, flat bar (vis-1 name: "Flat"). A linear gauge without plate borders. */
export default class CGFlatGauge extends GaugeBase<CommonRxData> {
    static getWidgetInfo(): RxWidgetInfo {
        return {
            id: 'tplCGflatGauge',
            visSet: 'canvas-gauges',
            visSetLabel: 'set_label',
            visName: 'Flat',
            visWidgetLabel: 'widget_flat',
            visHelp: 'help_flat',
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
                width: 360,
                height: 100,
                position: 'absolute',
            },
            visPrev: 'widgets/vis-2-widgets-canvas-gauges/img/prev_flat.svg',
        };
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo(): RxWidgetInfo {
        return CGFlatGauge.getWidgetInfo();
    }

    // eslint-disable-next-line class-methods-use-this
    getGaugeType(): GaugeType {
        return 'linear';
    }
}
