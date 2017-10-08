import express from 'express';
import pug from 'pug';
import { babel } from 'dynamic-require';
import morgan from 'morgan';

global.CLIENT = false;

// Error.stackTraceLimit = Infinity;

// helpers and constants
const here = process.cwd();
const log = ::console.log;
const port = process.env.PORT || 3000;
const app = express()
	.use(morgan(process.env.NODE_ENV === 'production'
		? '[:date[web]] :remote-addr :method/:http-version :url -- :status :response-time ms'
		: 'dev'
	));
const router = express.Router();

let hashes = {};
let devopt = {};
const dynamicRequire = babel(here);

if (process.env.NODE_ENV === 'production') {
	log('[pro]');
	app.use(require('compression')());
	let { readFileSync } = require('fs');
	hashes = JSON.parse(readFileSync('./hashes.json'));
}
else {
	log('[dev]');
	// use dev compilation and hot reloading
	const config = require('./wp.dev.babel').default,
		compiler = require('webpack')(config),
		dev = require('webpack-dev-middleware'),
		hot = require('webpack-hot-middleware');

	app.use(dev(compiler, {
		noInfo: true,
		publicPath: config.output.publicPath
	})).use(hot(compiler));
	devopt.hotAccept = require('./hot')
		.make(compiler, dynamicRequire, next => {
			for (let id in next) {
				let entry = next[id];
				hashes[id] = entry instanceof Array ? entry[0] : entry;
			}
		});
}

// takes a config and creates a server endpoint
let endpoint = ({ app, page, route, id }) => {
	const template = pug.compileFile(page);
	let program = dynamicRequire(app).default;

	if (process.env.NODE_ENV !== 'production') {
		// register program with hot rebuilder
		devopt.hotAccept(app, m => program = m.default);
	}

	router.get(route, (req, res) =>
		program()
			.sources.DOM
			.forEach(ssr =>
				res.send(template({ ssr, lib: 'lib/' + hashes[id] }))
			)
	);
}

import routes from './routes';
routes.forEach(endpoint);

app
	.use(router)
	.use(express.static('./public'));

app.listen(port, '::1', err => {
	if (err) {
		return console.err(err);
	}
	log(`listening on http://::1:${ port }`);
});
