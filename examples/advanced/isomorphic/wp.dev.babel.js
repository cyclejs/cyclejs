import w, { optimize as oz } from 'webpack';
import { entry, clientOutput, loaders } from './wp.constants';

export default {
	entry,
	output: clientOutput,
	module: { loaders },
	plugins: [
		new w.DefinePlugin({
			CLIENT: 'true'
		}),
		new oz.OccurrenceOrderPlugin(),
		new w.HotModuleReplacementPlugin(),
		new w.NoErrorsPlugin()
	],
	devtool: 'eval'
};
