/**
 * Turns the widget attributes into the option object of the `canvas-gauges` library.
 *
 * The attribute names are the ones the vis-1 widget set used, because vis-2 stores widget data per attribute
 * name and a project made with vis has to keep working. `buildOptions` is the counterpart of
 * `vis.binds['canvas-gauges'].gauge()` plus `linearGauge()` / `radialGauge()` of `widgets/canvas-gauges.html`.
 *
 * Two rules from there are load-bearing:
 *
 * 1. An attribute the user never touched must NOT end up in the options, otherwise it would override the
 *    default of the library. Hence `isSet()` in front of almost everything.
 * 2. The handful of options at the top are always written, even when empty - the vis-1 widget did the same, so
 *    e.g. an unchecked *Stroke ticks* really turns the strokes off instead of falling back to the library
 *    default `true`.
 */
import { buildMajorTicks, isSet, isTrue, toInt, toNumber } from './utils';

export type GaugeType = 'radial' | 'linear';

/** Attributes every gauge has */
export interface CommonRxData {
    oid: string;
    minValue: number | string;
    maxValue: number | string;
    units: string;
    title: string;
    factor: number | string;
    valueOffset: number | string;
    hCount: number | string;

    majorTicks: string | number;
    minorTicks: number | string;
    strokeTicks: boolean;
    majorTicksInt: number | string;
    majorTicksDec: number | string;
    exactTicks: boolean;
    numbersMargin: number | string;

    highlightsWidth: number | string;
    highlightsLineCap: string;

    animation: boolean;
    animationDuration: number | string;
    animationRule: string;
    animatedValue: boolean;
    animateOnInit: boolean;
    animationTarget: string;

    needle: boolean;
    needleShadow: boolean;
    needleType: string;
    needleStart: number | string;
    needleEnd: number | string;
    needleWidth: number | string;

    borders: boolean;
    borderOuterWidth: number | string;
    borderMiddleWidth: number | string;
    borderInnerWidth: number | string;
    borderShadowWidth: number | string;

    followTheme: boolean;

    valueBox: boolean;
    valueBoxStroke: number | string;
    valueBoxWidth: number | string;
    valueText: string;
    valueTextShadow: boolean;
    valueBoxBorderRadius: number | string;
    valueInt: number | string;
    valueDec: number | string;

    [attribute: string]: any;
}

/** Colours of the plate, the ticks and the needle - taken over one by one when they are set */
const COLORS = [
    'colorPlate',
    'colorPlateEnd',
    'colorMajorTicks',
    'colorMinorTicks',
    'colorTitle',
    'colorUnits',
    'colorNumbers',
    'colorNeedle',
    'colorNeedleEnd',
    'colorValueText',
    'colorValueTextShadow',
    'colorBorderShadow',
    'colorBorderOuter',
    'colorBorderOuterEnd',
    'colorBorderMiddle',
    'colorBorderMiddleEnd',
    'colorBorderInner',
    'colorBorderInnerEnd',
    'colorValueBoxRect',
    'colorValueBoxRectEnd',
    'colorValueBoxBackground',
    'colorValueBoxShadow',
    'colorNeedleShadowUp',
    'colorNeedleShadowDown',
    // not offered by the vis-1 set, although the library has always known it
    'colorStrokeTicks',
] as const;

/** Fonts: the family is a string, the size a number and style/weight strings again */
const FONT_NAMES = ['fontNumbers', 'fontTitle', 'fontUnits', 'fontValue'] as const;
const FONT_SIZES = ['fontNumbersSize', 'fontTitleSize', 'fontUnitsSize', 'fontValueSize'] as const;
const FONT_STYLES = [
    'fontNumbersStyle',
    'fontTitleStyle',
    'fontUnitsStyle',
    'fontValueStyle',
    'fontNumbersWeight',
    'fontTitleWeight',
    'fontUnitsWeight',
    'fontValueWeight',
] as const;

/** Only the linear gauge (and therefore the flat one and the progress bar) knows the bar */
const LINEAR_NUMBERS = ['barBeginCircle', 'barWidth', 'barLength', 'barStrokeWidth', 'barShadow'] as const;
const LINEAR_STRINGS = [
    'colorBarStroke',
    'colorBar',
    'colorBarEnd',
    'colorBarProgress',
    'colorBarProgressEnd',
    'colorBarShadow',
    'tickSide',
    'needleSide',
    'numberSide',
] as const;
const LINEAR_TICKS = ['ticksWidth', 'ticksWidthMinor', 'ticksPadding'] as const;

/** ... and only the radial gauge (and therefore the compass) the circle under the needle */
const RADIAL_NUMBERS = ['ticksAngle', 'startAngle', 'needleCircleSize'] as const;
const RADIAL_STRINGS = [
    'colorNeedleCircleOuter',
    'colorNeedleCircleOuterEnd',
    'colorNeedleCircleInner',
    'colorNeedleCircleInnerEnd',
] as const;
const RADIAL_BOOLEANS = ['needleCircleInner', 'needleCircleOuter'] as const;

/** Writes a boolean option only if the user checked or unchecked the box at least once */
function optionalBoolean(options: Record<string, any>, data: CommonRxData, name: string): void {
    if (isSet(data[name])) {
        options[name] = isTrue(data[name]);
    }
}

/** Writes a number option only if the field is filled - an empty field keeps the default of the library */
function optionalNumber(options: Record<string, any>, data: CommonRxData, name: string): void {
    if (isSet(data[name])) {
        options[name] = toNumber(data[name]);
    }
}

/**
 * Writes a string option only if the field is filled.
 *
 * `override` is the colour the dark theme brings along, and it wins: `getThemePalette()` only puts a colour in
 * there once it has established that the widget carries no decision of the user about it - the field is empty or
 * still holds the preset of the widget. Preferring the stored value here would keep the white plate of the flat
 * gauge white in the dark theme, because that white is its preset.
 */
function optionalString(options: Record<string, any>, data: CommonRxData, name: string, override?: string): void {
    if (override !== undefined) {
        options[name] = override;
    } else if (isSet(data[name])) {
        options[name] = data[name];
    }
}

/**
 * The sections of the scale that are painted in a colour of their own.
 *
 * The number of sections is `hCount`, and the values of section `n` are in `highlightsFrom<n>` and so on. The
 * linear gauge counts them from `minValue`, the radial one in the values of the scale - as in vis-1.
 */
function buildHighlights(
    data: CommonRxData,
    type: GaugeType,
    minValue: number,
): { from: number; to: number; color: string }[] | false {
    const count = toInt(data.hCount, 0);
    if (!count) {
        return false;
    }

    const highlights: { from: number; to: number; color: string }[] = [];
    const base = type === 'radial' ? 0 : minValue;

    for (let i = 1; i <= count; i++) {
        if (!isSet(data[`highlightsFrom${i}`])) {
            continue;
        }
        highlights.push({
            from: toNumber(data[`highlightsFrom${i}`], 0) - base,
            to: toNumber(data[`highlightsTo${i}`], 0) - base,
            color: data[`highlightsColor${i}`],
        });
    }

    return highlights;
}

/**
 * The options for one gauge.
 *
 * `width`/`height` are the measured size of the widget and `borderRadius` the rounding of its box - the linear
 * gauge draws its plate with it, so a widget with rounded corners does not stick out.
 */
export function buildOptions(
    data: CommonRxData,
    type: GaugeType,
    width: number,
    height: number,
    borderRadius: number,
    /** Colours of the dark theme, see `GaugeBase.getThemePalette()`. Empty in the light theme */
    palette: Record<string, string> = {},
): Record<string, any> {
    const minValue = toNumber(data.minValue, 0);
    let maxValue = toNumber(data.maxValue, NaN);
    if (isNaN(maxValue)) {
        maxValue = 100;
    }

    const options: Record<string, any> = {
        width,
        height,
        title: data.title || '',
        minValue,
        maxValue,
        units: data.units || '',
        // not options of the library: the widget scales the state value with them before it hands it over
        factor: toNumber(data.factor, 1) || 1,
        offset: toNumber(data.valueOffset, 0),

        minorTicks: toInt(data.minorTicks, 0) || 1,
        strokeTicks: isTrue(data.strokeTicks),
        majorTicksInt: toInt(data.majorTicksInt, 0) || 4,
        majorTicksDec: toInt(data.majorTicksDec, 0) || 2,

        animation: isTrue(data.animation),
        animationDuration: toInt(data.animationDuration, 0) || 500,
        animationRule: data.animationRule || 'linear',
        animatedValue: isTrue(data.animatedValue),
        animateOnInit: isTrue(data.animateOnInit),

        highlights: buildHighlights(data, type, minValue),
        majorTicks: buildMajorTicks(data.majorTicks, minValue, maxValue),
    };

    COLORS.forEach(name => optionalString(options, data, name, palette[name]));

    // Options the library has always had, which the vis-1 attribute set never offered
    optionalBoolean(options, data, 'exactTicks');
    optionalNumber(options, data, 'numbersMargin');
    optionalNumber(options, data, 'highlightsWidth');
    optionalString(options, data, 'highlightsLineCap');
    optionalNumber(options, data, 'valueBoxWidth');

    optionalBoolean(options, data, 'needle');
    optionalBoolean(options, data, 'needleShadow');
    optionalString(options, data, 'needleType');
    optionalNumber(options, data, 'needleStart');
    optionalNumber(options, data, 'needleEnd');
    optionalNumber(options, data, 'needleWidth');

    optionalBoolean(options, data, 'borders');
    optionalNumber(options, data, 'borderOuterWidth');
    optionalNumber(options, data, 'borderMiddleWidth');
    optionalNumber(options, data, 'borderInnerWidth');
    optionalNumber(options, data, 'borderShadowWidth');

    optionalBoolean(options, data, 'valueBox');
    optionalNumber(options, data, 'valueBoxStroke');
    optionalBoolean(options, data, 'valueTextShadow');
    optionalNumber(options, data, 'valueBoxBorderRadius');
    optionalNumber(options, data, 'valueInt');
    optionalNumber(options, data, 'valueDec');

    FONT_NAMES.forEach(name => optionalString(options, data, name));
    FONT_SIZES.forEach(name => optionalNumber(options, data, name));
    // vis-1 wrote `fontValueWeight` into `fontNumbers` - a typo that made the value weight change the font family
    FONT_STYLES.forEach(name => optionalString(options, data, name));

    if (type === 'linear') {
        options.borderRadius = borderRadius;
        LINEAR_NUMBERS.forEach(name => optionalNumber(options, data, name));
        LINEAR_STRINGS.forEach(name => optionalString(options, data, name, palette[name]));
        // vis-1 assigned `ticksPadding` to `barBeginCircle`, so the padding moved the round end of the bar
        LINEAR_TICKS.forEach(name => optionalNumber(options, data, name));
        optionalBoolean(options, data, 'barProgress');
    } else {
        RADIAL_NUMBERS.forEach(name => optionalNumber(options, data, name));
        RADIAL_STRINGS.forEach(name => optionalString(options, data, name, palette[name]));
        RADIAL_BOOLEANS.forEach(name => optionalBoolean(options, data, name));
        optionalString(options, data, 'animationTarget');
    }

    return options;
}
