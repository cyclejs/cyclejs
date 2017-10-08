import uniq from 'lodash.uniq';

const log = ::console.log;

let concatMap = (arr, f) => {
	let result = [];
	arr.forEach(a => {
		result = result.concat(f(a) || []);
	});
	return result;
}

let isEntry = m => m.reasons.length === 0;
let lookupModule = (name, modules) => modules.find(m => m.name == name);
let deleteCache = name => delete require.cache[require.resolve(name)];

let resolveEntries = (built, modules) => {
	let entries = [];

	let commitEntries = reasons => {
		let residue = [];
		reasons.forEach(name =>
			(isEntry(lookupModule(name, modules)) ? entries : residue)
				.push(name)
		);
		return residue;
	}

	let children = commitEntries(built);
	children.forEach(deleteCache);

	while (children.length !== 0) {
		let invalids = children
			.map(name => lookupModule(name, modules));

		built = uniq(
			concatMap(invalids, a => a.reasons)
				.map(a => a.moduleName)
		);

		children = commitEntries(built);
		children.forEach(deleteCache);
	}

	entries = uniq(entries);
	entries.forEach(deleteCache);

	return entries;
}

export let make = (compiler, dynamicRequire, updateHashes) => {
	let first = true;
	let registry = {};

	compiler.plugin('done', result => {
		let stats = result.toJson();
		if (first) {
			first = false;
		}
		else {
			let { modules } = stats;

			let built = modules.filter(a => a.built).map(a => a.name);
			built.forEach(deleteCache);

			let entries = resolveEntries(built, modules) // invalid entries
			entries.forEach(file => {
					try {
						log(`reloading ${ file }`);
						registry[file](dynamicRequire(file));
						log(`reloaded ${ file }`);
					}
					catch (e) {
						log (e);
					}
				});
		}

		updateHashes(stats.assetsByChunkName);
	});

	return (src, callback) => {
		registry[src] = callback;
	};
}
