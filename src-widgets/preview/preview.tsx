/*
 * The development page: `npm run preview` in the root.
 *
 * Shows all five widgets against a stub of `VisRxWidget`, without an ioBroker. The value lives in this page and
 * is fed into every widget at once, so the needles and bars can be watched while dragging the slider - the same
 * round trip a state change takes in vis-2.
 *
 * Not part of the widget set - excluded from lint and never built into `widgets/`.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';

import { WIDGETS } from './widgets';
import { defaultSize, withDefaults } from './stub';

const OID = 'preview.0.value';

const CONTEXT = {
    light: { setValue: (): void => {}, socket: {}, themeType: 'light' },
    dark: { setValue: (): void => {}, socket: {}, themeType: 'dark' },
};

/** One widget in a box of its default size */
function Widget(props: {
    type: any;
    name: string;
    data: Record<string, any>;
    value: number;
    editMode: boolean;
    dark: boolean;
}): React.JSX.Element {
    const size = defaultSize(props.type);
    const Type = props.type;

    return (
        <div style={{ margin: 12 }}>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>{props.name}</div>
            <div
                style={{
                    position: 'relative',
                    width: size.width,
                    height: size.height,
                    borderRadius: size.borderRadius,
                }}
            >
                <Type
                    context={props.dark ? CONTEXT.dark : CONTEXT.light}
                    editMode={props.editMode}
                    view="view"
                    id="w1"
                    refParent={{ current: null }}
                    values={{
                        [`${OID}.val`]: props.value,
                        [`${OID}.ack`]: true,
                        [`${OID}.lc`]: Date.now(),
                    }}
                    rxStyle={{ 'border-radius': size.borderRadius }}
                    rxData={withDefaults(Type, { ...props.data, oid: OID })}
                />
            </div>
        </div>
    );
}

function Preview(): React.JSX.Element {
    const [value, setValue] = React.useState(42);
    const [editMode, setEditMode] = React.useState(false);
    const [dark, setDark] = React.useState(false);
    const [valueBox, setValueBox] = React.useState(true);
    const [highlights, setHighlights] = React.useState(true);
    const [running, setRunning] = React.useState(false);

    // A value that walks up and down on its own - the fastest way to see whether the animation is smooth
    React.useEffect(() => {
        if (!running) {
            return;
        }
        let direction = 1;
        const timer = setInterval(() => {
            setValue(old => {
                if (old >= 100) {
                    direction = -1;
                }
                if (old <= 0) {
                    direction = 1;
                }
                return old + direction * 7;
            });
        }, 800);
        return () => clearInterval(timer);
    }, [running]);

    const data: Record<string, any> = {
        minValue: 0,
        maxValue: 100,
        units: '%',
        title: 'Preview',
        valueBox,
        valueDec: 1,
        hCount: highlights ? 2 : 0,
        highlightsFrom1: 0,
        highlightsTo1: 60,
        highlightsColor1: '#a5d6a7',
        highlightsFrom2: 60,
        highlightsTo2: 100,
        highlightsColor2: '#ef9a9a',
    };

    // The compass keeps its own scale of 0 ... 360, so the shared value is stretched onto it with the factor.
    // Its scale is the directions, the sections of the others would make no sense on it
    const compassData: Record<string, any> = {
        ...data,
        units: '',
        title: '',
        minValue: 0,
        maxValue: 360,
        factor: 3.6,
        hCount: 0,
    };

    // The progress bar is meant to be looked at as it comes out of the palette, so it keeps its own defaults -
    // only the value box follows the switch above, and it is drawn anyway just while the bar stands upright
    const progressData: Record<string, any> = { valueBox };

    return (
        <div
            style={{
                padding: 16,
                minHeight: '100vh',
                background: dark ? '#23272e' : '#fff',
                color: dark ? '#dfe3e8' : '#333',
            }}
        >
            <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                <label>
                    Value&nbsp;
                    <input
                        type="range"
                        min={0}
                        max={100}
                        value={value}
                        onChange={e => setValue(parseInt(e.target.value, 10))}
                    />
                    &nbsp;{value}
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={running}
                        onChange={e => setRunning(e.target.checked)}
                    />
                    &nbsp;run
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={valueBox}
                        onChange={e => setValueBox(e.target.checked)}
                    />
                    &nbsp;value box
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={highlights}
                        onChange={e => setHighlights(e.target.checked)}
                    />
                    &nbsp;highlights
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={editMode}
                        onChange={e => setEditMode(e.target.checked)}
                    />
                    &nbsp;edit mode
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={dark}
                        onChange={e => setDark(e.target.checked)}
                    />
                    &nbsp;dark theme
                </label>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                {WIDGETS.map(widget => (
                    <Widget
                        key={widget.name}
                        name={widget.name}
                        type={widget.type}
                        data={
                            widget.name === 'compas'
                                ? compassData
                                : widget.name === 'progress'
                                  ? progressData
                                  : data
                        }
                        value={value}
                        editMode={editMode}
                        dark={dark}
                    />
                ))}
            </div>
        </div>
    );
}

createRoot(document.getElementById('root')!).render(<Preview />);
