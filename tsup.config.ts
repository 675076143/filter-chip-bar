import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    headless: 'src/headless.ts',
    'adapters/FilterChipBarAntd6': 'src/adapters/FilterChipBarAntd6.tsx',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ['react', 'react-dom', 'antd', '@ant-design/icons', 'dayjs'],
});
