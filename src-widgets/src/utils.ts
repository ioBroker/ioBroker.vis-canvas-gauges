/**
 * Helpers shared by all canvas-gauges widgets.
 *
 * Widget attributes come out of the vis editor as strings, so every value that is logically a boolean or a number
 * has to be coerced before use - the vis-1 widget set did that inline everywhere, here it lives in one place.
 */

/** `true`, `'true'` and `1` are true; everything else is false */
export function isTrue(value: unknown): boolean {
    return value === true || value === 'true' || value === 1 || value === '1';
}

/** `undefined`, `null` and `''` all mean "the user did not set this attribute" */
export function isSet(value: unknown): boolean {
    return value !== undefined && value !== null && value !== '';
}

/** Parses a value that may be a number, a numeric string or empty. Returns `defaultValue` when it is not a number */
export function toNumber(value: unknown, defaultValue = 0): number {
    if (typeof value === 'number') {
        return isFinite(value) ? value : defaultValue;
    }
    if (typeof value !== 'string' || value === '') {
        return defaultValue;
    }
    const parsed = parseFloat(value.replace(',', '.'));
    return isFinite(parsed) ? parsed : defaultValue;
}

/** Same as `toNumber`, but rounds to an integer - the counterpart of the `parseInt(x, 10) || d` of the vis-1 set */
export function toInt(value: unknown, defaultValue = 0): number {
    const parsed = toNumber(value, NaN);
    return isNaN(parsed) ? defaultValue : Math.round(parsed);
}

/**
 * The value text under the needle, with leading zeros and a fixed number of decimals.
 *
 * `valueInt` is the number of digits before and `valueDec` the number of digits after the comma. The gauge
 * library formats the value itself, but only in the canvas it draws - since 1.0.1 the widget passes the text in
 * explicitly, because Firefox otherwise keeps the text of the previous frame.
 */
export function padValue(value: number, valueInt: number, valueDec: number): string {
    if (!isFinite(value)) {
        return '';
    }
    const negative = value < 0;
    const positive = Math.abs(value);
    let text: string;

    if (valueDec > 0) {
        const parts = positive.toFixed(valueDec).split('.');
        text = `${parts[0].padStart(valueInt, '0')}.${parts[1]}`;
    } else {
        text = Math.round(positive).toString().padStart(valueInt, '0');
    }

    return negative ? `-${text}` : text;
}

/**
 * The major ticks of the scale, in the three shapes the vis-1 widget accepted:
 *
 * - a list of labels (`N,NE,E,...`) - used as they are, this is how the compass gets its directions
 * - a count (`6`) - that many labels evenly spread between `minValue` and `maxValue`
 * - empty - six labels, so the scale is divided into five sections
 */
export function buildMajorTicks(majorTicks: unknown, minValue: number, maxValue: number): (string | number)[] {
    if (typeof majorTicks === 'string' && majorTicks.includes(',')) {
        return majorTicks.split(',').map(tick => tick.trim());
    }

    const count = toNumber(majorTicks, 0);
    // (count - 1) sections for `count` labels; without a count the scale gets the five sections of vis-1
    const sections = count ? count - 1 : 5;
    if (sections <= 0) {
        return [minValue];
    }

    const step = (maxValue - minValue) / sections;
    if (!isFinite(step) || step <= 0) {
        return [minValue];
    }

    const ticks: number[] = [];
    // `sections + 1` labels instead of accumulating until `maxValue` is passed: adding a fractional step up
    // repeatedly drops the last label as soon as the sum overshoots by a rounding error
    for (let i = 0; i <= sections; i++) {
        ticks.push(minValue + step * i);
    }
    return ticks;
}
