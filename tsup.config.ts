import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    headless: 'src/headless.ts',
    primitives: 'src/primitives.ts',
    antd6: 'examples/antd6-renderer.tsx',
  },
  format: ['cjs', 'esm'],
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ['react', 'react-dom', 'dayjs', 'antd', '@ant-design/icons'],
});
