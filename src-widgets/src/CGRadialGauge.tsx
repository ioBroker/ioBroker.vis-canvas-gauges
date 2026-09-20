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
 * The defaults of `tplCGradialGauge` in `widgets/canvas-gauges.html`.
 *
 * `needleType` was `select` there - the name of the field type had slipped into the default. The needle was
 * drawn as an arrow anyway, since the library only checks for `line`, so `arrow` is the honest default.
 */
const DEFAULTS: Defaults = {
    factor: 1,
    valueOffset: 0,
    hCount: 1,
    minorTicks: 4,
    animation: true,
    needle: true,
    needleShadow: true,
    needleType: 'arrow',
    borders: true,
    borderOuterWidth: 2,
    borderMiddleWidth: 2,
    borderInnerWidth: 2,
    borderShadowWidth: 2,
    valueBox: false,
    ticksAngle: 270,
    startAngle: 45,
};

/**
 * `tplCGradialGauge` - the round gauge with a needle (vis-1 name: "Radial").
 *
 * A scale over 270 degrees that starts at the lower left, the classic instrument look of canvas-gauges.
 */
export default class CGRadialGauge extends GaugeBase<CommonRxData> {
    static getWidgetInfo(): RxWidgetInfo {
        return {
            id: 'tplCGradialGauge',
            visSet: 'canvas-gauges',
            visSetLabel: 'set_label',
            visName: 'Radial',
            visWidgetLabel: 'widget_radial',
            visHelp: 'help_radial',
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
            visPrev: 'widgets/vis-2-widgets-canvas-gauges/img/prev_radial.svg',
        };
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo(): RxWidgetInfo {
        return CGRadialGauge.getWidgetInfo();
    }

    // eslint-disable-next-line class-methods-use-this
    getGaugeType(): GaugeType {
        return 'radial';
    }
}
