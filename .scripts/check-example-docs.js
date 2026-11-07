'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const url = require('url');
const {execFileSync} = require('child_process');
const ts = require('typescript');
const dox = require.resolve('dox/package.json', {
  paths: [path.dirname(require.resolve('markdox/package.json'))],
});
const MarkdownIt = require(require.resolve('markdown-it', {
  paths: [path.dirname(dox)],
}));
const markdown = new MarkdownIt();
const rootArg = process.argv.slice(2).find(arg => arg.indexOf('--root=') === 0);
const root = rootArg
  ? path.resolve(rootArg.slice('--root='.length))
  : path.resolve(__dirname, '..');
const baseArg = process.argv.slice(2).find(arg => arg.indexOf('--base=') === 0);
const base = baseArg && baseArg.slice('--base='.length);
const printer = ts.createPrinter({removeComments: true});
const failures = [];
let guides = 0;
let sources = 0;
let references = 0;

function check(condition, message) {
  if (!condition) failures.push(message);
}

function links(tokens, file) {
  for (const token of tokens) {
    const href =
      token.type === 'link_open'
        ? token.attrGet('href')
        : token.type === 'image'
        ? token.attrGet('src')
        : null;
    if (href) {
      const parsed = new URL(href, url.pathToFileURL(file));
      if (parsed.protocol === 'file:' && href.charAt(0) !== '#') {
        references++;
        check(
          fs.existsSync(url.fileURLToPath(parsed)),
          path.relative(root, file) + ': missing local target ' + href
        );
      }
    }
    if (token.children) links(token.children, file);
  }
}

function readGuide(file) {
  if (!fs.existsSync(file)) {
    failures.push(path.relative(root, file) + ': missing guide');
    return '';
  }
  const text = fs.readFileSync(file, 'utf8');
  links(markdown.parse(text, {}), file);
  return text;
}

function sourceFiles(directory) {
  for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
    if (
      entry.isDirectory() &&
      entry.name !== 'node_modules' &&
      entry.name !== 'dist' &&
      entry.name !== 'lib'
    ) {
      sourceFiles(path.join(directory, entry.name));
    } else if (
      entry.isFile() &&
      ['.js', '.ts', '.tsx'].indexOf(path.extname(entry.name)) !== -1
    ) {
      const file = path.join(directory, entry.name);
      const relative = path
        .relative(root, file)
        .split(path.sep)
        .join('/');
      const kind =
        path.extname(file) === '.ts' ? ts.ScriptKind.TS : ts.ScriptKind.TSX;
      const current = ts.createSourceFile(
        relative,
        fs.readFileSync(file, 'utf8'),
        ts.ScriptTarget.Latest,
        true,
        kind
      );
      sources++;
      check(
        current.parseDiagnostics.length === 0,
        relative + ': source parse errors'
      );
      if (base) {
        const original = execFileSync('git', ['show', base + ':' + relative], {
          cwd: root,
          encoding: 'utf8',
        });
        const previous = ts.createSourceFile(
          relative,
          original,
          ts.ScriptTarget.Latest,
          true,
          kind
        );
        check(
          printer.printFile(previous) === printer.printFile(current),
          relative + ': non-comment source changes'
        );
      }
    }
  }
}

const catalog = readGuide(path.join(root, 'examples/README.md'));
readGuide(path.join(root, 'examples/RUNNING.md'));
for (const level of ['basic', 'intermediate', 'advanced']) {
  const levelPath = path.join(root, 'examples', level);
  for (const name of fs.readdirSync(levelPath).sort()) {
    const directory = path.join(levelPath, name);
    if (!fs.existsSync(path.join(directory, 'package.json'))) continue;
    const pkg = JSON.parse(
      fs.readFileSync(path.join(directory, 'package.json'), 'utf8')
    );
    const text = readGuide(path.join(directory, 'README.md'));
    const tokens = markdown.parse(text, {});
    guides++;
    for (const heading of ['Learn', 'Flow', 'Run', 'Limits']) {
      check(
        tokens.some(
          (token, index) =>
            token.type === 'heading_open' &&
            token.tag === 'h2' &&
            tokens[index + 1].content === heading
        ),
        level + '/' + name + ': missing ' + heading
      );
    }
    check(
      text.indexOf('[Source](') !== -1,
      level + '/' + name + ': missing source tour'
    );
    check(
      !!pkg.scripts.start,
      level + '/' + name + ': documented start script missing'
    );
    check(
      catalog.indexOf('./' + level + '/' + name + '/README.md') !== -1,
      level + '/' + name + ': missing catalog entry'
    );
    sourceFiles(directory);
  }
}
for (const failure of failures) console.error(failure);
assert.strictEqual(
  failures.length,
  0,
  failures.length + ' documentation checks failed'
);
console.log(
  JSON.stringify({
    guides,
    sources,
    localReferences: references,
    commentOnlyBase: base || null,
  })
);
