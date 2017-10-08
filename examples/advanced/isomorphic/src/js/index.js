/* global CLIENT */
import { run } from '@cycle/core';
import { makeDOMDriver, makeHTMLDriver } from '@cycle/dom';
import { rerunner, restartable } from 'cycle-restart';

let main = require('./main').default;

export default () =>
	run(main, {
		DOM: makeHTMLDriver()
	});

if (CLIENT) {
	let drivers = {
		DOM: restartable(makeDOMDriver('#root'), { pauseSinksWhileReplaying: false })
	};

	let rerun = rerunner(run);
	rerun(main, drivers);

	if (module.hot) {
		require('webpack-hot-middleware/client');
		module.hot.accept(() => {
			main = require('./main').default;
			rerun(main, drivers);
		});
	}
}
