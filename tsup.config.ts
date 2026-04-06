import { defineConfig } from 'tsup';

export default defineConfig({
    entry: {
        'tables/index': 'tables/index.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: false,
    splitting: false,
    minify: false,
    treeshake: true,
    outDir: 'dist',
});