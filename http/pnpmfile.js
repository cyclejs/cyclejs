module.exports = {
  hooks: {
    readPackage,
  },
};

function readPackage(pkg, context) {
  if (!pkg.dependencies) return pkg;

  if (pkg.dependencies.rxjs === '*') {
    pkg.dependencies.rxjs = '^5.5.11';
    context.log('rxjs@* => rxjs@5 in ' + pkg.name);
  }

  return pkg;
}
