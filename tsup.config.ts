import { defineConfig } from 'tsup';

export default defineConfig({
    entry: {
        'index': 'src/index.ts',
        'ajax': 'src/ajax.ts',
        'bindings': 'src/bindings.ts',
        'deviceDetector': 'src/deviceDetector.ts',
        'notifications': 'src/notifications.ts',
        'functions': 'src/functions.ts',
        'tables/index': 'src/tables/index.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    splitting: false,
    minify: false,
    treeshake: true,
    outDir: 'dist',
});
