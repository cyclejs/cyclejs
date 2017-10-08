import w from 'webpack';
import { loaders, productionPlugins } from './wp.constants';
import nodeExternals from 'webpack-node-externals';

export default {
	entry: './index.js',
	output: {
		path: __dirname,
		filename: 'server.js'
	},
	module: { loaders },
	plugins: [
		new w.DefinePlugin({
			'process.env.NODE_ENV': '\'production\''
		}),
		...productionPlugins
	],
	target: 'node',
	externals: [nodeExternals()]
};
