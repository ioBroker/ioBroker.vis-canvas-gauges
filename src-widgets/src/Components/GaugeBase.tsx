import React from 'react';

import type {
    RxRenderWidgetProps,
    RxWidgetInfoAttributesField,
    RxWidgetInfoAttributesFieldCheckbox,
    RxWidgetInfoAttributesFieldDefault,
    RxWidgetInfoAttributesFieldSelect,
    RxWidgetInfoAttributesFieldSimple,
    RxWidgetInfoAttributesFieldSlider,
    RxWidgetInfoFieldChangeHandler,
    RxWidgetInfoGroup,
    VisRxWidgetProps,
    VisRxWidgetState,
} from '@iobroker/types-vis-2';

import Generic from '../Generic';
import GaugeCanvas from './GaugeCanvas';
import { buildOptions, type CommonRxData, type GaugeType } from '../gaugeOptions';
import { isSet, isTrue, padValue, toInt, toNumber } from '../utils';
import '../styles.css';

/**
 * Default value of an attribute, per widget.
 *
 * The four widgets are the same gauge with different presets - the compass is a radial gauge with a full circle
 * and the directions as labels, the flat gauge a linear one without borders. Therefore every group of settings
 * below takes the defaults of the widget that asks for it, and they are the ones the vis-1 templates declared in
 * their `data-vis-attrs` (`name[default]`).
 */
export type Defaults = Record<string, string | number | boolean | undefined>;

export interface GaugeState extends VisRxWidgetState {
    width: number;
    height: number;
    /** Rounding of the widget box - the linear gauge draws its plate with it */
    borderRadius: number;
}

/**
 * The colours the dark theme of vis-2 puts in place of the light defaults of the library.
 *
 * Only what the instrument has in common with the view changes: the plate, the scale, the texts, the rings and
 * the track of the bar. The needle keeps its colour in both themes - it is a part of the instrument itself, and a
 * salmon needle reads just as well on a dark plate. The same holds for the progress colour of a bar, which the
 * user picks to mean something.
 *
 * Every entry replaces the default of the library, never a colour the user picked; `getThemePalette()` below
 * sorts that out.
 */
const DARK_PALETTE: Record<string, string> = {
    colorPlate: '#2a2a2e',
    colorMajorTicks: '#e0e0e0',
    colorMinorTicks: '#9e9e9e',
    colorTitle: '#b0b0b0',
    colorUnits: '#b0b0b0',
    colorNumbers: '#d8d8d8',
    colorValueText: '#eaeaea',
    colorValueTextShadow: 'rgba(0,0,0,0.6)',

    colorBorderOuter: '#4a4a50',
    colorBorderOuterEnd: '#35353a',
    colorBorderMiddle: '#55555c',
    colorBorderMiddleEnd: '#3e3e44',
    colorBorderInner: '#2f2f34',
    colorBorderInnerEnd: '#26262a',

    colorValueBoxRect: '#6a6a72',
    colorValueBoxRectEnd: '#4a4a50',
    colorValueBoxBackground: '#1e1e22',

    // the circle the needle of a radial gauge turns around
    colorNeedleCircleOuter: '#55555c',
    colorNeedleCircleOuterEnd: '#3e3e44',
    colorNeedleCircleInner: '#4a4a50',
    colorNeedleCircleInnerEnd: '#5a5a62',

    // the empty part of the bar of a linear gauge
    colorBar: '#3a3a40',
};

// ------------------------------------------------------------------------------- field helpers

const text = (name: string, defaults: Defaults): RxWidgetInfoAttributesFieldDefault => ({
    name,
    label: name,
    default: defaults[name] as string,
});

const color = (name: string, defaults: Defaults): RxWidgetInfoAttributesFieldSimple => ({
    name,
    label: name,
    type: 'color',
    default: defaults[name] as string,
});

const check = (name: string, defaults: Defaults): RxWidgetInfoAttributesFieldCheckbox => ({
    name,
    label: name,
    type: 'checkbox',
    default: defaults[name] as boolean,
});

const slider = (name: string, min: number, max: number, defaults: Defaults): RxWidgetInfoAttributesFieldSlider => ({
    name,
    label: name,
    type: 'slider',
    min,
    max,
    step: 1,
    default: defaults[name] as number,
});

/**
 * A select whose entries are translated.
 *
 * The options are written as objects and not as plain strings on purpose: vis-2 puts the i18n prefix of the
 * widget set only in front of the `label` of an object option, while a string option is looked up as a global
 * word - `arrow` would then stay untranslated.
 */
const select = (name: string, options: string[], defaults: Defaults): RxWidgetInfoAttributesFieldSelect => ({
    name,
    label: name,
    type: 'select',
    options: options.map(value => ({ value, label: value })),
    default: defaults[name] as string,
});

const fontName = (name: string, defaults: Defaults): RxWidgetInfoAttributesFieldSimple => ({
    name,
    label: name,
    type: 'fontname',
    default: defaults[name] as string,
});

/** `normal` / `italic` / `oblique`, as a list without translation */
const fontStyle = (name: string, defaults: Defaults): RxWidgetInfoAttributesFieldSelect => ({
    name,
    label: name,
    type: 'nselect',
    options: ['', 'normal', 'italic', 'oblique'],
    noTranslation: true,
    default: defaults[name] as string,
});

/** Free text with the usual CSS weights as suggestions, because a number is allowed too */
const fontWeight = (name: string, defaults: Defaults): RxWidgetInfoAttributesFieldSelect => ({
    name,
    label: name,
    type: 'auto',
    options: ['', 'normal', 'bold', 'bolder', 'lighter'],
    noTranslation: true,
    default: defaults[name] as string,
});

/**
 * Fills *Min*, *Max*, *Units* and *Title* from the object as soon as an object ID is chosen - the counterpart of
 * `vis.binds['canvas-gauges'].changedId` of the vis-1 set. Only empty fields are filled, a setting of the user
 * is never overwritten.
 */
const fillFromObject: RxWidgetInfoFieldChangeHandler = async (_field, data, changeData, socket) => {
    if (!data.oid || data.oid === 'nothing_selected') {
        return;
    }
    const obj = await socket.getObject(data.oid);
    if (obj?.type !== 'state' || !obj.common) {
        return;
    }

    let changed = false;
    const take = (attribute: string, value: unknown): void => {
        if (value !== undefined && value !== null && !isSet(data[attribute])) {
            data[attribute] = value;
            changed = true;
        }
    };

    take('minValue', obj.common.min);
    take('maxValue', obj.common.max);
    take('units', obj.common.unit);
    take('title', typeof obj.common.name === 'object' ? undefined : obj.common.name);

    if (changed) {
        changeData(data);
    }
};

// ------------------------------------------------------------------------------- attribute groups

/** Object ID and the value range. Shown first, without a heading of its own */
export function groupCommon(defaults: Defaults): RxWidgetInfoGroup {
    return {
        name: 'common',
        fields: [
            { name: 'oid', type: 'id', label: 'oid', onChange: fillFromObject },
            { name: 'minValue', label: 'minValue', type: 'number', default: defaults.minValue as number },
            { name: 'maxValue', label: 'maxValue', type: 'number', default: defaults.maxValue as number },
            text('units', defaults),
            text('title', defaults),
            { name: 'factor', label: 'factor', type: 'number', default: defaults.factor as number },
            { name: 'valueOffset', label: 'valueOffset', type: 'number', default: defaults.valueOffset as number },
            slider('hCount', 0, 20, defaults),
            /*
             * The width and the ends of the coloured band belong to all sections at once, so they cannot live in
             * the indexed group below - that one repeats every field per section. They stand next to `hCount`,
             * the other setting of the sections that is not per section, and disappear with it.
             */
            { ...slider('highlightsWidth', 0, 50, defaults), hidden: '!data.hCount' },
            { ...select('highlightsLineCap', ['butt', 'round'], defaults), hidden: '!data.hCount' },
        ],
    };
}

/** The coloured sections of the scale, one set of fields per section */
export function groupHighlights(): RxWidgetInfoGroup {
    return {
        name: 'highlights',
        label: 'group_highlights',
        indexFrom: 1,
        indexTo: 'hCount',
        fields: [
            { name: 'highlightsFrom', label: 'highlightsFrom', type: 'number' },
            { name: 'highlightsTo', label: 'highlightsTo', type: 'number' },
            { name: 'highlightsColor', label: 'highlightsColor', type: 'color' },
        ],
    };
}

/**
 * The scale. *Major ticks* takes a number of labels or a list of texts - the compass uses the list for its
 * directions, which is why the field is free text and not a slider as in vis-1.
 */
export function groupTicks(defaults: Defaults): RxWidgetInfoGroup {
    return {
        name: 'ticks',
        label: 'group_ticks',
        fields: [
            { ...text('majorTicks', defaults), tooltip: 'majorTicks_tooltip' },
            slider('minorTicks', 0, 50, defaults),
            check('strokeTicks', defaults),
            { ...check('exactTicks', defaults), tooltip: 'exactTicks_tooltip' },
            slider('majorTicksInt', 0, 10, defaults),
            slider('majorTicksDec', 0, 10, defaults),
            slider('numbersMargin', 0, 50, defaults),
        ],
    };
}

const ANIMATION_RULES = [
    'linear',
    'quad',
    'quint',
    'cycle',
    'bounce',
    'elastic',
    'dequad',
    'dequint',
    'decycle',
    'debounce',
    'delastic',
];

/** How the needle travels to a new value. `withTarget` adds the choice of moving the plate instead (radial only) */
export function groupAnimation(defaults: Defaults, withTarget: boolean): RxWidgetInfoGroup {
    const fields: RxWidgetInfoAttributesField[] = [
        check('animation', defaults),
        {
            name: 'animationDuration',
            label: 'animationDuration',
            type: 'slider',
            min: 0,
            max: 2000,
            step: 50,
            default: defaults.animationDuration as number,
        },
        { ...select('animationRule', ANIMATION_RULES, defaults), noTranslation: true },
        check('animatedValue', defaults),
        check('animateOnInit', defaults),
    ];

    if (withTarget) {
        // own label keys, because `needle` is already the label of the "Show needle" checkbox
        fields.push({
            name: 'animationTarget',
            label: 'animationTarget',
            type: 'select',
            options: [
                { value: 'needle', label: 'target_needle' },
                { value: 'plate', label: 'target_plate' },
            ],
            default: defaults.animationTarget as string,
        });
    }

    return { name: 'animation', label: 'group_animation', fields };
}

const COLOR_FIELDS = [
    'colorPlate',
    'colorPlateEnd',
    'colorMajorTicks',
    'colorMinorTicks',
    'colorStrokeTicks',
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
];

/** All colours of the plate, the scale and the needle. Empty keeps the colour of the library */
export function groupColorsGauge(defaults: Defaults): RxWidgetInfoGroup {
    return {
        name: 'colorsGauge',
        label: 'group_colorsGauge',
        fields: [
            { ...check('followTheme', defaults), tooltip: 'followTheme_tooltip' },
            ...COLOR_FIELDS.map(name => color(name, defaults)),
        ],
    };
}

/** Shape of the needle */
export function groupNeedle(defaults: Defaults): RxWidgetInfoGroup {
    return {
        name: 'needle',
        label: 'group_needle',
        fields: [
            check('needle', defaults),
            check('needleShadow', defaults),
            select('needleType', ['arrow', 'line'], defaults),
            slider('needleStart', 0, 100, defaults),
            slider('needleEnd', 0, 100, defaults),
            slider('needleWidth', 0, 50, defaults),
        ],
    };
}

/** The three rings around the plate plus their shadow */
export function groupBorders(defaults: Defaults): RxWidgetInfoGroup {
    return {
        name: 'borders',
        label: 'group_borders',
        fields: [
            check('borders', defaults),
            slider('borderOuterWidth', 0, 20, defaults),
            slider('borderMiddleWidth', 0, 20, defaults),
            slider('borderInnerWidth', 0, 20, defaults),
            slider('borderShadowWidth', 0, 20, defaults),
        ],
    };
}

/** The box with the value under the needle */
export function groupValueBox(defaults: Defaults): RxWidgetInfoGroup {
    return {
        name: 'valueBox',
        label: 'group_valueBox',
        fields: [
            check('valueBox', defaults),
            slider('valueBoxStroke', 0, 20, defaults),
            { ...slider('valueBoxWidth', 0, 100, defaults), tooltip: 'valueBoxWidth_tooltip' },
            { ...text('valueText', defaults), tooltip: 'valueText_tooltip' },
            check('valueTextShadow', defaults),
            slider('valueBoxBorderRadius', 0, 20, defaults),
            slider('valueInt', 0, 20, defaults),
            slider('valueDec', 0, 20, defaults),
        ],
    };
}

/** Family, size, style and weight of the four texts of the gauge */
export function groupFonts(defaults: Defaults): RxWidgetInfoGroup {
    return {
        name: 'fonts',
        label: 'group_fonts',
        fields: [
            fontName('fontNumbers', defaults),
            fontName('fontTitle', defaults),
            fontName('fontUnits', defaults),
            fontName('fontValue', defaults),
            slider('fontNumbersSize', 0, 100, defaults),
            slider('fontTitleSize', 0, 100, defaults),
            slider('fontUnitsSize', 0, 100, defaults),
            slider('fontValueSize', 0, 100, defaults),
            fontStyle('fontNumbersStyle', defaults),
            fontStyle('fontTitleStyle', defaults),
            fontStyle('fontUnitsStyle', defaults),
            fontStyle('fontValueStyle', defaults),
            fontWeight('fontNumbersWeight', defaults),
            fontWeight('fontTitleWeight', defaults),
            fontWeight('fontUnitsWeight', defaults),
            fontWeight('fontValueWeight', defaults),
        ],
    };
}

// --------------------------------------------------------------- only the linear and the flat gauge

/** The bar the linear gauge fills up to the value */
export function groupGaugeBar(defaults: Defaults): RxWidgetInfoGroup {
    return {
        name: 'gaugeBar',
        label: 'group_gaugeBar',
        fields: [
            slider('barBeginCircle', 0, 360, defaults),
            slider('barWidth', 0, 50, defaults),
            slider('barLength', 0, 100, defaults),
            slider('barStrokeWidth', 0, 50, defaults),
            slider('barShadow', 0, 50, defaults),
            check('barProgress', defaults),
        ],
    };
}

export function groupColorsBar(defaults: Defaults): RxWidgetInfoGroup {
    return {
        name: 'colorsBar',
        label: 'group_colorsBar',
        fields: [
            color('colorBarStroke', defaults),
            color('colorBar', defaults),
            color('colorBarEnd', defaults),
            color('colorBarProgress', defaults),
            color('colorBarProgressEnd', defaults),
            color('colorBarShadow', defaults),
        ],
    };
}

/** Which side of the bar the scale, the needle and the numbers are drawn on */
export function groupPositions(defaults: Defaults): RxWidgetInfoGroup {
    const sides = ['both', 'left', 'right'];
    return {
        name: 'positions',
        label: 'group_positions',
        fields: [
            select('tickSide', sides, defaults),
            select('needleSide', sides, defaults),
            select('numberSide', sides, defaults),
        ],
    };
}

export function groupTicksBar(defaults: Defaults): RxWidgetInfoGroup {
    return {
        name: 'ticksBar',
        label: 'group_ticksBar',
        fields: [
            slider('ticksWidth', 0, 50, defaults),
            slider('ticksWidthMinor', 0, 50, defaults),
            slider('ticksPadding', 0, 50, defaults),
        ],
    };
}

// --------------------------------------------------------------- only the radial gauge and the compass

/** How far the scale runs around the plate and where it starts */
export function groupGaugeRadial(defaults: Defaults): RxWidgetInfoGroup {
    return {
        name: 'gaugeRadial',
        label: 'group_gaugeRadial',
        fields: [slider('ticksAngle', 0, 360, defaults), slider('startAngle', 0, 360, defaults)],
    };
}

export function groupColorsRadial(defaults: Defaults): RxWidgetInfoGroup {
    return {
        name: 'colorsRadial',
        label: 'group_colorsRadial',
        fields: [
            color('colorNeedleCircleOuter', defaults),
            color('colorNeedleCircleOuterEnd', defaults),
            color('colorNeedleCircleInner', defaults),
            color('colorNeedleCircleInnerEnd', defaults),
        ],
    };
}

/** The circle in the middle that the needle turns around */
export function groupNeedleRadial(defaults: Defaults): RxWidgetInfoGroup {
    return {
        name: 'needleRadial',
        label: 'group_needleRadial',
        fields: [
            slider('needleCircleSize', 0, 200, defaults),
            check('needleCircleInner', defaults),
            check('needleCircleOuter', defaults),
        ],
    };
}

// ------------------------------------------------------------------------------- the widget itself

/**
 * The common implementation of all five widgets.
 *
 * The widget measures itself - the gauge draws into a canvas of a fixed pixel size, so every resize in the
 * editor and every change of the view has to reach the library as a new `width`/`height`.
 */
export default abstract class GaugeBase<RxData extends CommonRxData> extends Generic<RxData, GaugeState> {
    private readonly refRoot: React.RefObject<HTMLDivElement | null> = React.createRef();
    private resizeObserver: ResizeObserver | null = null;
    /** The `default` of every field of this widget, collected once from `getWidgetInfo()` */
    private fieldDefaults: Record<string, any> | null = null;

    constructor(props: VisRxWidgetProps) {
        super(props);
        this.state = { ...this.state, width: 0, height: 0, borderRadius: 0 };
    }

    /** `radial` for the radial gauge and the compass, `linear` for the linear and the flat gauge */
    abstract getGaugeType(): GaugeType;

    /**
     * Colours this widget keeps in both themes, although they are in `DARK_PALETTE`.
     *
     * For a widget whose default is a decision rather than a light-theme colour - the transparent plate of the
     * progress bar, for instance, which lets the view through in either theme.
     */
    // eslint-disable-next-line class-methods-use-this
    protected getThemeExceptions(): string[] {
        return [];
    }

    /** The values the vis editor writes into a freshly created widget of this type */
    private getFieldDefaults(): Record<string, any> {
        if (!this.fieldDefaults) {
            const defaults: Record<string, any> = {};
            for (const group of this.getWidgetInfo().visAttrs) {
                // a `delimiter` field carries neither a name nor a default, hence the cast
                for (const field of group.fields as { name?: string; default?: any }[]) {
                    if (field.name && field.default !== undefined) {
                        defaults[field.name] = field.default;
                    }
                }
            }
            this.fieldDefaults = defaults;
        }
        return this.fieldDefaults;
    }

    /**
     * The colours of the dark theme that this widget actually takes over.
     *
     * A colour is only replaced while the user has not decided about it himself - the field is empty, or it still
     * carries the default this widget was created with. That is what makes the switch useful for the flat gauge,
     * whose white plate comes from its own preset, without ever overruling a colour someone picked.
     *
     * Empty in the light theme and whenever the switch is off, which is the case for every widget that was placed
     * before this setting existed.
     */
    protected getThemePalette(): Record<string, string> {
        if (this.props.context.themeType !== 'dark' || !isTrue(this.state.rxData.followTheme)) {
            return {};
        }

        const data = this.state.rxData as Record<string, any>;
        const defaults = this.getFieldDefaults();
        const exceptions = this.getThemeExceptions();
        const palette: Record<string, string> = {};

        for (const [name, color] of Object.entries(DARK_PALETTE)) {
            if (exceptions.includes(name)) {
                continue;
            }
            if (!isSet(data[name]) || data[name] === defaults[name]) {
                palette[name] = color;
            }
        }
        return palette;
    }

    componentDidMount(): void {
        super.componentDidMount();
        if (this.refRoot.current) {
            this.resizeObserver = new ResizeObserver(() => this.measure());
            this.resizeObserver.observe(this.refRoot.current);
            this.measure();
        }
    }

    componentWillUnmount(): void {
        super.componentWillUnmount();
        this.resizeObserver?.disconnect();
        this.resizeObserver = null;
    }

    componentDidUpdate(prevProps: VisRxWidgetProps, prevState: typeof this.state): void {
        super.componentDidUpdate(prevProps, prevState);
        this.measure();
    }

    private measure(): void {
        const el = this.refRoot.current;
        if (!el) {
            return;
        }
        const borderRadius = toNumber(window.getComputedStyle(el).borderRadius, 0);
        if (
            el.clientWidth !== this.state.width ||
            el.clientHeight !== this.state.height ||
            borderRadius !== this.state.borderRadius
        ) {
            this.setState({ width: el.clientWidth, height: el.clientHeight, borderRadius });
        }
    }

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element {
        super.renderWidgetBody(props);

        const data = this.state.rxData as CommonRxData;
        const type = this.getGaugeType();
        const options = buildOptions(
            data,
            type,
            this.state.width,
            this.state.height,
            this.state.borderRadius,
            this.getThemePalette(),
        );

        const oid = data.oid && data.oid !== 'nothing_selected' ? data.oid : '';
        const raw = oid ? this.state.values[`${oid}.val`] : undefined;
        const hasValue = raw !== undefined && raw !== null && raw !== '';

        const value = hasValue ? toNumber(raw, 0) * options.factor + options.offset : (options.minValue as number) || 0;

        // With a value the box shows it with the configured digits; without one the configured text is left -
        // an empty text makes the library format the value itself
        const valueText = hasValue
            ? padValue(value, toInt(data.valueInt, 0), toInt(data.valueDec, 0))
            : data.valueText || '';

        return (
            <div
                ref={this.refRoot}
                className="vis-canvas-gauges"
            >
                {this.state.width && this.state.height ? (
                    <GaugeCanvas
                        type={type}
                        options={options}
                        value={value}
                        valueText={valueText}
                    />
                ) : null}
            </div>
        );
    }
}
