/*
 * Loads the four widgets - after `stub.tsx`, which has to put `window.visRxWidget` in place first.
 *
 * Shared by the development page and the screenshot page, so both always show the same set.
 */

// puts the stub of `window.visRxWidget` on the window - must stay the first import
import './stub';

const [
    { default: CGLinearGauge },
    { default: CGRadialGauge },
    { default: CGCompas },
    { default: CGFlatGauge },
] = await Promise.all([
    import('../src/CGLinearGauge'),
    import('../src/CGRadialGauge'),
    import('../src/CGCompas'),
    import('../src/CGFlatGauge'),
]);

export { CGLinearGauge, CGRadialGauge, CGCompas, CGFlatGauge };

/** In the order of the palette */
export const WIDGETS = [
    { name: 'linear', type: CGLinearGauge },
    { name: 'radial', type: CGRadialGauge },
    { name: 'compas', type: CGCompas },
    { name: 'flat', type: CGFlatGauge },
];
