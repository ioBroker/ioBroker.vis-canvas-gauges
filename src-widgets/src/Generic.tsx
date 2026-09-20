import type { VisRxWidgetState } from '@iobroker/types-vis-2';
import type VisRxWidget from '@iobroker/types-vis-2/visRxWidget';

/**
 * Base class of every canvas-gauges widget.
 *
 * `window.visRxWidget` is provided by the vis-2 runtime, so the widget set is built against the react copy of the
 * host instead of shipping its own.
 */
export default class Generic<
    RxData extends Record<string, any>,
    State extends Partial<VisRxWidgetState> = VisRxWidgetState,
> extends (window.visRxWidget as typeof VisRxWidget)<RxData, State> {
    static getI18nPrefix(): string {
        return 'vis_canvas_gauges_';
    }
}
