module.exports = {
  hooks: {
    readPackage,
  },
};

function readPackage(pkg, context) {
  // pnpm is strict with dependencies, so this is needed
  if (pkg.name === 'snabbdom-selector') {
    pkg.dependencies = Object.assign({}, pkg.dependencies, {
      snabbdom: '*',
    });
  }

  return pkg;
}
