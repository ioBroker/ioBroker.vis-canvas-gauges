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

/** The defaults of `tplCGlinearGauge` in `widgets/canvas-gauges.html` */
const DEFAULTS: Defaults = {
    factor: 1,
    valueOffset: 0,
    hCount: 1,
    followTheme: true,
    minorTicks: 5,
    animation: true,
    borders: true,
    valueBox: false,
    barProgress: true,
};

/**
 * `tplCGlinearGauge` - the upright gauge with a bar (vis-1 name: "Linear").
 *
 * The plain linear gauge of the library: everything is left at its default, so it looks like the classic
 * thermometer style of canvas-gauges.
 */
export default class CGLinearGauge extends GaugeBase<CommonRxData> {
    static getWidgetInfo(): RxWidgetInfo {
        return {
            id: 'tplCGlinearGauge',
            visSet: 'canvas-gauges',
            visSetLabel: 'set_label',
            visName: 'Linear',
            visWidgetLabel: 'widget_linear',
            visHelp: 'help_linear',
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
                width: 150,
                height: 250,
                'border-radius': '10px',
                position: 'absolute',
            },
            visPrev: 'widgets/vis-2-widgets-canvas-gauges/img/prev_linear.svg',
        };
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo(): RxWidgetInfo {
        return CGLinearGauge.getWidgetInfo();
    }

    // eslint-disable-next-line class-methods-use-this
    getGaugeType(): GaugeType {
        return 'linear';
    }
}
