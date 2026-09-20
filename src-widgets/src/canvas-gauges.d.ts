/**
 * `canvas-gauges` ships one UMD bundle and no types.
 *
 * Only the part the widgets use is declared here: the two gauge classes, which take a bag of options, draw
 * themselves into a canvas and animate to a new `value`. The full list of options is documented at
 * https://canvas-gauges.com.
 *
 * This file must stay free of top-level `import`/`export`, otherwise `declare module` would be read as an
 * augmentation of an existing module instead of the declaration of one without types.
 */
declare module 'canvas-gauges' {
    interface GaugeOptions {
        renderTo: HTMLCanvasElement | string;
        [option: string]: any;
    }

    class BaseGauge {
        constructor(options: GaugeOptions);
        options: Record<string, any>;
        value: number;
        draw(): this;
        update(options: Record<string, any>): this;
        destroy(): void;
    }

    class RadialGauge extends BaseGauge {}

    class LinearGauge extends BaseGauge {}
}
