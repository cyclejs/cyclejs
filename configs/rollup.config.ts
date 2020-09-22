import { readFileSync } from 'fs';
import sourcemaps from 'rollup-plugin-sourcemaps';

const pkg = JSON.parse(readFileSync('./package.json', { encoding: 'utf-8' }));

const format = process.env.BUNDLE_FORMAT || 'esm';

export default {
  input: 'build/index.js',
  external: pkg.dependencies ? Object.keys(pkg.dependencies) : [],
  plugins: [sourcemaps()],
  output: {
    file: `build/bundle.${format}.js`,
    sourcemap: true,
    format,
  },
};
