import { defineConfig } from 'tsup';

export default defineConfig({
    entry: [
        'src/index.ts',
        'src/server/index.ts',
        'src/react/index.ts',
        'src/core/index.ts',
        'src/contracts/index.ts'
    ],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    external: ['react', 'react-dom', 'express']
});
