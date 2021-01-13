import { readFileSync } from 'fs';
import sourcemaps from 'rollup-plugin-sourcemaps';

const pkg = JSON.parse(readFileSync('./package.json', { encoding: 'utf-8' }));

const format = process.env.BUNDLE_FORMAT || 'esm';

const dependencies = pkg.dependencies ? Object.keys(pkg.dependencies) : [];
const peerDependencies = pkg.peerDependencies
  ? Object.keys(pkg.peerDependencies)
  : [];

export default {
  input: 'build/index.js',
  external: dependencies.concat(peerDependencies),
  plugins: [sourcemaps()],
  output: {
    file: `build/bundle.${format}.js`,
    sourcemap: true,
    format,
  },
};
