/*
 * Scenes for the screenshots of the documentation (`docs/img/*.png`).
 *
 * Every `<section data-shot="name">` becomes one image: `screenshots.mjs` opens this page in a headless Chrome
 * and cuts the sections out. All values are fixed and the animation is off, so the images only change when a
 * widget changes.
 *
 * Not part of the widget set - excluded from lint and never built into `widgets/`.
 */
import React, { type CSSProperties } from 'react';
import { createRoot } from 'react-dom/client';

import { CGCompas, CGFlatGauge, CGLinearGauge, CGProgress, CGRadialGauge } from './widgets';
import { defaultSize, withDefaults } from './stub';

const OID = 'shots.0.value';

const CONTEXT = {
    light: { setValue: (): void => {}, socket: {}, themeType: 'light' },
    dark: { setValue: (): void => {}, socket: {}, themeType: 'dark' },
};

/** Theme of the current scene - the widgets read it from `context.themeType` */
const DarkTheme = React.createContext(false);

/** Acknowledged state with one value */
function states(value: number): Record<string, any> {
    return { [`${OID}.val`]: value, [`${OID}.ack`]: true, [`${OID}.lc`]: Date.now() };
}

/** One widget with the attributes the vis editor would store for it */
function W(props: {
    type: any;
    value: number;
    data?: Record<string, any>;
    width?: number;
    height?: number;
}): React.JSX.Element {
    const dark = React.useContext(DarkTheme);
    const size = defaultSize(props.type);
    const Type = props.type;
    const width = props.width || size.width;
    const height = props.height || size.height;

    return (
        <div style={{ position: 'relative', width, height, borderRadius: size.borderRadius }}>
            <Type
                context={dark ? CONTEXT.dark : CONTEXT.light}
                editMode={false}
                view="view"
                id="w1"
                refParent={{ current: null }}
                values={states(props.value)}
                rxStyle={{ 'border-radius': size.borderRadius }}
                // the screenshots must not catch a running animation
                rxData={withDefaults(Type, { oid: OID, animation: false, ...props.data })}
            />
        </div>
    );
}

/** One screenshot. The caption under a widget explains what the picture shows */
function Shot(props: {
    name: string;
    dark?: boolean;
    style?: CSSProperties;
    children: React.ReactNode;
}): React.JSX.Element {
    return (
        <DarkTheme.Provider value={!!props.dark}>
            <section
                data-shot={props.name}
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'flex-end',
                    gap: 16,
                    width: 'max-content',
                    padding: 16,
                    boxSizing: 'border-box',
                    background: props.dark ? '#23272e' : '#fafafa',
                    color: props.dark ? '#dfe3e8' : '#333',
                    ...props.style,
                }}
            >
                {props.children}
            </section>
        </DarkTheme.Provider>
    );
}

function Labeled(props: { text: string; children: React.ReactNode }): React.JSX.Element {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            {props.children}
            <div style={{ fontSize: 12, fontFamily: 'Tahoma, sans-serif' }}>{props.text}</div>
        </div>
    );
}

const BASE = { minValue: 0, maxValue: 100, units: '%', title: 'Kitchen' };

/** Three coloured sections, used by the pictures of the section settings */
const SECTIONS = {
    hCount: 3,
    highlightsFrom1: 0,
    highlightsTo1: 50,
    highlightsColor1: '#a5d6a7',
    highlightsFrom2: 50,
    highlightsTo2: 80,
    highlightsColor2: '#ffe082',
    highlightsFrom3: 80,
    highlightsTo3: 100,
    highlightsColor3: '#ef9a9a',
};

function Shots(): React.JSX.Element {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
            <Shot name="overview">
                <W
                    type={CGLinearGauge}
                    value={64}
                    data={BASE}
                />
                <W
                    type={CGRadialGauge}
                    value={64}
                    data={BASE}
                />
                <W
                    type={CGCompas}
                    value={135}
                    data={{ title: '', units: '' }}
                />
                <W
                    type={CGFlatGauge}
                    value={64}
                    data={BASE}
                />
                <W
                    type={CGProgress}
                    value={64}
                    data={{}}
                />
            </Shot>

            <Shot
                name="darktheme"
                dark
            >
                <Labeled text="switch on">
                    <W
                        type={CGRadialGauge}
                        value={64}
                        data={{ ...BASE, valueBox: true }}
                    />
                </Labeled>
                <Labeled text="switch off">
                    <W
                        type={CGRadialGauge}
                        value={64}
                        data={{ ...BASE, valueBox: true, followTheme: false }}
                    />
                </Labeled>
                <Labeled text="flat on">
                    <W
                        type={CGFlatGauge}
                        value={64}
                        data={BASE}
                    />
                </Labeled>
                <Labeled text="flat off">
                    <W
                        type={CGFlatGauge}
                        value={64}
                        data={{ ...BASE, followTheme: false }}
                    />
                </Labeled>
            </Shot>

            <Shot name="progress">
                <Labeled text="default">
                    <W
                        type={CGProgress}
                        value={64}
                        data={{}}
                    />
                </Labeled>
                <Labeled text="with a scale">
                    <W
                        type={CGProgress}
                        value={64}
                        data={{
                            units: '%',
                            colorNumbers: '#888',
                            majorTicks: 6,
                            minorTicks: 5,
                            ticksWidth: 12,
                            ticksWidthMinor: 6,
                        }}
                    />
                </Labeled>
                <Labeled text="upright, with the value box">
                    <W
                        type={CGProgress}
                        value={64}
                        data={{ colorBarProgress: '#4caf50', valueBox: true, units: '%' }}
                        width={80}
                        height={180}
                    />
                </Labeled>
            </Shot>

            <Shot name="linear">
                <W
                    type={CGLinearGauge}
                    value={64}
                    data={BASE}
                />
                <W
                    type={CGLinearGauge}
                    value={64}
                    data={{ ...BASE, valueBox: true, valueDec: 1 }}
                />
                <W
                    type={CGLinearGauge}
                    value={64}
                    data={{ ...BASE, barProgress: false, barWidth: 20 }}
                />
            </Shot>

            <Shot name="radial">
                <W
                    type={CGRadialGauge}
                    value={64}
                    data={BASE}
                />
                <W
                    type={CGRadialGauge}
                    value={64}
                    data={{ ...BASE, valueBox: true, valueInt: 3, valueDec: 1 }}
                />
                <W
                    type={CGRadialGauge}
                    value={64}
                    data={{ ...BASE, needleType: 'line', needleStart: 20, needleEnd: 95, needleWidth: 3 }}
                />
            </Shot>

            <Shot name="compas">
                <W
                    type={CGCompas}
                    value={45}
                    data={{ title: '', units: '' }}
                />
                <W
                    type={CGCompas}
                    value={200}
                    data={{ title: '', units: '' }}
                />
                <W
                    type={CGCompas}
                    value={200}
                    data={{ title: '', units: '', valueBox: true, valueInt: 3, colorValueText: '#eee' }}
                />
            </Shot>

            <Shot name="flat">
                <W
                    type={CGFlatGauge}
                    value={64}
                    data={BASE}
                />
                <W
                    type={CGFlatGauge}
                    value={64}
                    data={{ ...BASE, barWidth: 12, colorBarProgress: '#4caf50' }}
                />
            </Shot>

            <Shot name="highlights">
                <Labeled text="hCount = 0">
                    <W
                        type={CGRadialGauge}
                        value={78}
                        data={{ ...BASE, hCount: 0 }}
                    />
                </Labeled>
                <Labeled text="3 sections">
                    <W
                        type={CGRadialGauge}
                        value={78}
                        data={{
                            ...BASE,
                            hCount: 3,
                            highlightsFrom1: 0,
                            highlightsTo1: 50,
                            highlightsColor1: '#a5d6a7',
                            highlightsFrom2: 50,
                            highlightsTo2: 80,
                            highlightsColor2: '#ffe082',
                            highlightsFrom3: 80,
                            highlightsTo3: 100,
                            highlightsColor3: '#ef9a9a',
                        }}
                    />
                </Labeled>
                <Labeled text="on the flat gauge">
                    <W
                        type={CGFlatGauge}
                        value={78}
                        data={{
                            ...BASE,
                            hCount: 2,
                            highlightsFrom1: 0,
                            highlightsTo1: 80,
                            highlightsColor1: '#a5d6a7',
                            highlightsFrom2: 80,
                            highlightsTo2: 100,
                            highlightsColor2: '#ef9a9a',
                        }}
                    />
                </Labeled>
            </Shot>

            <Shot name="exactticks">
                <Labeled text="off (evenly spread)">
                    <W
                        type={CGRadialGauge}
                        value={64}
                        data={{ ...BASE, title: '', majorTicks: '0,10,50,100' }}
                    />
                </Labeled>
                <Labeled text="on (at their own value)">
                    <W
                        type={CGRadialGauge}
                        value={64}
                        data={{ ...BASE, title: '', majorTicks: '0,10,50,100', exactTicks: true }}
                    />
                </Labeled>
            </Shot>

            <Shot name="highlightswidth">
                <Labeled text="width 5">
                    <W
                        type={CGRadialGauge}
                        value={64}
                        data={{ ...BASE, title: '', ...SECTIONS, highlightsWidth: 5 }}
                    />
                </Labeled>
                <Labeled text="width 30">
                    <W
                        type={CGRadialGauge}
                        value={64}
                        data={{ ...BASE, title: '', ...SECTIONS, highlightsWidth: 30 }}
                    />
                </Labeled>
                <Labeled text="round ends">
                    <W
                        type={CGRadialGauge}
                        value={64}
                        data={{ ...BASE, title: '', ...SECTIONS, highlightsWidth: 12, highlightsLineCap: 'round' }}
                    />
                </Labeled>
            </Shot>

            <Shot name="ticks">
                <Labeled text="empty (5 sections)">
                    <W
                        type={CGRadialGauge}
                        value={64}
                        data={{ ...BASE, title: '' }}
                    />
                </Labeled>
                <Labeled text="majorTicks = 11">
                    <W
                        type={CGRadialGauge}
                        value={64}
                        data={{ ...BASE, title: '', majorTicks: '11', minorTicks: 2 }}
                    />
                </Labeled>
                <Labeled text="a list of texts">
                    <W
                        type={CGRadialGauge}
                        value={64}
                        data={{ ...BASE, title: '', units: '', majorTicks: 'off,low,mid,high,max' }}
                    />
                </Labeled>
            </Shot>

            <Shot name="valuebox">
                <Labeled text="off">
                    <W
                        type={CGRadialGauge}
                        value={7.25}
                        data={{ ...BASE, title: '', valueBox: false }}
                    />
                </Labeled>
                <Labeled text="0 / 0">
                    <W
                        type={CGRadialGauge}
                        value={7.25}
                        data={{ ...BASE, title: '', valueBox: true }}
                    />
                </Labeled>
                <Labeled text="3 / 2">
                    <W
                        type={CGRadialGauge}
                        value={7.25}
                        data={{ ...BASE, title: '', valueBox: true, valueInt: 3, valueDec: 2 }}
                    />
                </Labeled>
            </Shot>

            <Shot name="borders">
                <Labeled text="on">
                    <W
                        type={CGRadialGauge}
                        value={64}
                        data={{ ...BASE, title: '' }}
                    />
                </Labeled>
                <Labeled text="off">
                    <W
                        type={CGRadialGauge}
                        value={64}
                        data={{ ...BASE, title: '', borders: false }}
                    />
                </Labeled>
                <Labeled text="wide outer ring">
                    <W
                        type={CGRadialGauge}
                        value={64}
                        data={{
                            ...BASE,
                            title: '',
                            borderOuterWidth: 12,
                            borderMiddleWidth: 0,
                            borderInnerWidth: 0,
                        }}
                    />
                </Labeled>
            </Shot>

            <Shot name="positions">
                <Labeled text="left (default)">
                    <W
                        type={CGFlatGauge}
                        value={64}
                        data={{ ...BASE, title: '' }}
                    />
                </Labeled>
                <Labeled text="both">
                    <W
                        type={CGFlatGauge}
                        value={64}
                        data={{ ...BASE, title: '', tickSide: 'both', numberSide: 'both', needleSide: 'both' }}
                    />
                </Labeled>
            </Shot>

            <Shot name="colors">
                <W
                    type={CGRadialGauge}
                    value={64}
                    data={{
                        ...BASE,
                        colorPlate: '#2e3440',
                        colorMajorTicks: '#eceff4',
                        colorMinorTicks: '#9aa5b1',
                        colorNumbers: '#d8dee9',
                        colorTitle: '#d8dee9',
                        colorUnits: '#9aa5b1',
                        colorNeedle: '#ebcb8b',
                        colorNeedleEnd: '#d08770',
                        colorBorderOuter: '#4c566a',
                        colorBorderOuterEnd: '#3b4252',
                        colorBorderMiddle: '#434c5e',
                        colorBorderMiddleEnd: '#3b4252',
                        colorBorderInner: '#2e3440',
                        colorBorderInnerEnd: '#2e3440',
                        colorValueText: '#eceff4',
                        colorValueBoxBackground: '#2e3440',
                        valueBox: true,
                        valueDec: 1,
                    }}
                />
                <W
                    type={CGFlatGauge}
                    value={64}
                    data={{
                        ...BASE,
                        colorPlate: '#2e3440',
                        colorMajorTicks: '#eceff4',
                        colorMinorTicks: '#9aa5b1',
                        colorNumbers: '#d8dee9',
                        colorTitle: '#d8dee9',
                        colorUnits: '#9aa5b1',
                        colorNeedle: '#ebcb8b',
                        colorBar: '#3b4252',
                        colorBarProgress: '#88c0d0',
                        barWidth: 12,
                    }}
                />
            </Shot>
        </div>
    );
}

createRoot(document.getElementById('root')!).render(<Shots />);

/*
 * The widgets measure themselves and only then create the canvas, and the library draws on the next frame. Two
 * frames plus a moment is enough for every scene - `screenshots.mjs` waits for this flag.
 */
requestAnimationFrame(() =>
    requestAnimationFrame(() =>
        setTimeout(() => {
            (window as any).__shotsReady = true;
        }, 500),
    ),
);
