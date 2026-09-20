// @ts-expect-error no types
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';
import { moduleFederationShared } from '@iobroker/types-vis-2/modulefederation.vis.config';
import { readFileSync } from 'node:fs';
import topLevelAwait from 'vite-plugin-top-level-await';

// The shared modules come from @iobroker/types-vis-2, so react, the JSX runtime, @emotion and MUI stay the
// singletons the vis-2 host provides instead of being bundled a second time. Passing package.json filters that
// list down to the packages this widget set really uses.
const pack = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

const config = {
    plugins: [
        federation({
            manifest: true,
            name: 'visCanvasGauges',
            filename: 'customWidgets.js',
            exposes: {
                './CGLinearGauge': './src/CGLinearGauge',
                './CGRadialGauge': './src/CGRadialGauge',
                './CGCompas': './src/CGCompas',
                './CGFlatGauge': './src/CGFlatGauge',
                './CGProgress': './src/CGProgress',
                './translations': './src/translations.ts',
            },
            remotes: {},
            shared: moduleFederationShared(pack),
            dts: false,
        }),
        topLevelAwait({
            promiseExportName: '__tla',
            promiseImportName: (i: number): string => `__tla_${i}`,
        }),
        react(),
    ],
    server: {
        port: 3000,
        proxy: {
            '/_socket': 'http://localhost:8082',
            '/vis-2': 'http://localhost:8082',
            '/adapter': 'http://localhost:8082',
            '/widgets': 'http://localhost:8082/vis-2',
            '/widgets.html': 'http://localhost:8082/vis-2',
            '/web': 'http://localhost:8082',
            '/state': 'http://localhost:8082',
        },
    },
    base: './',
    resolve: {
        tsconfigPaths: true,
        // Same set as the shared modules above: the fallback copies inside the bundle must be unique too
        dedupe: ['react', 'react-dom'],
    },
    // `canvas-gauges` ships as a single UMD file; without this vite would leave the `require` in the dev server
    optimizeDeps: {
        include: ['canvas-gauges'],
    },
    build: {
        target: 'chrome81',
        outDir: './build',
        commonjsOptions: {
            // the UMD bundle of canvas-gauges assigns to `module.exports`, which rollup only picks up in mixed mode
            transformMixedEsModules: true,
        },
        rollupOptions: {
            onwarn(warning: { code: string }, warn: (warning: { code: string }) => void): void {
                if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
                    return;
                }
                warn(warning);
            },
        },
    },
};

export default config;
