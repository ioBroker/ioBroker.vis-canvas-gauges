import React from 'react';
import { LinearGauge, RadialGauge, type BaseGauge } from 'canvas-gauges';

import type { GaugeType } from '../gaugeOptions';

interface GaugeCanvasProps {
    /** `radial` for the radial gauge and the compass, `linear` for the linear and the flat gauge */
    type: GaugeType;
    /** The complete option object, see `buildOptions()` */
    options: Record<string, any>;
    /** Value of the state, already multiplied by the factor and shifted by the value offset */
    value: number;
    /** Text in the value box. Passed in instead of letting the library format it, see below */
    valueText: string;
}

/**
 * The canvas of one gauge.
 *
 * The library draws imperatively into a `<canvas>`: the instance is created once and afterwards only fed with
 * `update()` (options) and `value` (the needle, which then animates to the new position). Re-creating it on
 * every render would restart the animation on every state change, so it is kept in a ref and only replaced when
 * the gauge type changes.
 *
 * `valueText` is handed over instead of letting the gauge format the value itself: Firefox otherwise keeps the
 * text of the previous frame in the value box. That is the workaround of version 1.0.1, and it is also what
 * makes "Before comma" / "After comma" of the value box work the way the vis-1 widget shows them.
 */
export default function GaugeCanvas(props: GaugeCanvasProps): React.JSX.Element {
    const refCanvas = React.useRef<HTMLCanvasElement>(null);
    const refGauge = React.useRef<BaseGauge | null>(null);
    const refProps = React.useRef(props);
    const refApplied = React.useRef<{ options: string; value: number; valueText: string } | null>(null);

    // The widget re-renders on every state change and builds a new option object each time. Only a real change
    // of the content may reach `update()`, otherwise the gauge would redraw on every value
    const optionsKey = JSON.stringify(props.options);

    /*
     * The latest props, reachable from the two effects below without making them re-run. Declared first, so
     * react has already run it for this commit when the effects after it are called.
     */
    React.useEffect(() => {
        refProps.current = props;
    });

    React.useEffect(() => {
        const canvas = refCanvas.current;
        if (!canvas) {
            return;
        }
        const { options, value, valueText } = refProps.current;
        const Gauge = refProps.current.type === 'radial' ? RadialGauge : LinearGauge;

        const gauge = new Gauge({
            ...options,
            renderTo: canvas,
            valueText,
            // as in vis-1 the gauge starts at the beginning of the scale, so "Animate on start" has something to
            // animate from
            value: options.minValue || 0,
        });
        gauge.draw();
        gauge.value = value;

        refGauge.current = gauge;
        refApplied.current = { options: JSON.stringify(options), value, valueText };

        return () => {
            refGauge.current = null;
            refApplied.current = null;
            gauge.destroy();
        };
    }, [props.type]);

    React.useEffect(() => {
        const gauge = refGauge.current;
        const applied = refApplied.current;
        if (!gauge || !applied) {
            return;
        }

        if (applied.options !== optionsKey || applied.valueText !== props.valueText) {
            applied.options = optionsKey;
            applied.valueText = props.valueText;
            // `update()` merges, so the text has to travel with the options - it is one of them for the library
            gauge.update({ ...refProps.current.options, valueText: props.valueText });
        }

        if (applied.value !== props.value) {
            applied.value = props.value;
            // the setter starts the animation towards the new position
            gauge.value = props.value;
        }
    }, [optionsKey, props.value, props.valueText]);

    return <canvas ref={refCanvas} />;
}
