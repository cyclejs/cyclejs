'use strict';
var fs = require('fs');
var ejs = require('ejs');
var path = require('path');

var template = ejs.compile(fs.readFileSync(__dirname + '/template.html', 'utf-8'));

var chapters = [
  {id: 'getting-started', title: 'Getting started'},
  {id: 'dialogue', title: 'Dialogue abstraction'},
  {id: 'streams', title: 'Streams'},
  {id: 'basic-examples', title: 'Basic examples'},
  {id: 'model-view-intent', title: 'Model-View-Intent'},
  {id: 'components', title: 'Components'},
  {id: 'drivers', title: 'Drivers'},
  {id: 'examples', title: 'Examples'},
];

// Escapa caracteres especiales para evitar romper la tabla Markdown
function escapeMarkdown(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

// Genera una referencia Markdown de los ejemplos del repositorio.
// Cada ejemplo se describe a partir de su package.json (description)
// o, en su defecto, del primer parrafo de su README.md.
function generateExamplesReference() {
  var examplesDir = path.resolve(__dirname, '..', '..', 'examples');
  var entries = [];
  try {
    entries = fs.readdirSync(examplesDir, { withFileTypes: true })
      .filter(function (e) { return e.isDirectory(); })
      .map(function (e) { return e.name; })
      .sort();
  } catch (err) {
    return '# Examples\n\n_No se pudo leer el directorio de ejemplos._\n';
  }

  var lines = ['# Examples', '', 'Referencia de los ejemplos incluidos en el repositorio y lo que demuestran.', '', '| Ejemplo | Descripción |', '|---|---|'];
  entries.forEach(function (name) {
    var dir = path.join(examplesDir, name);
    var description = '';
    try {
      var pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf-8'));
      description = pkg.description || '';
    } catch (e) { /* sin package.json */ }
    if (!description) {
      try {
        var readme = fs.readFileSync(path.join(dir, 'README.md'), 'utf-8');
        var paragraphs = readme.split(/\n\s*\n/).map(function (p) { return p.trim(); }).filter(Boolean);
        description = paragraphs.length ? paragraphs[0].replace(/\n/g, ' ') : '';
      } catch (e) { /* sin README */ }
    }
    if (!description) description = 'Sin descripción disponible.';
    lines.push('| [' + name + '](../examples/' + name + ') | ' + escapeMarkdown(description) + ' |');
  });
  lines.push('');
  return lines.join('\n');
}

chapters.forEach(function (chapter, i) {
  var mdFilename = __dirname + '/../content/documentation/' + chapter.id + '.md';
  var htmlFilename = __dirname + '/../' + chapter.id + '.html';
  var content;
  if (chapter.id === 'examples') {
    content = generateExamplesReference();
  } else {
    content = fs.readFileSync(mdFilename, 'utf-8');
  }
  var menuItems = chapters.map(c => ({link: c.id + '.html', title: c.title}));
  var premenu = menuItems.filter((c, j) => j < i);
  var postmenu = menuItems.filter((c, j) => j > i);
  var outputStr = template({
    title: chapter.title,
    pathToRoot: '',
    content: content,
    premenu: premenu,
    postmenu: postmenu,
  });
  fs.writeFileSync(htmlFilename, outputStr, 'utf-8');
});

// Exportaciones para pruebas unitarias / verificación
module.exports = {
  chapters: chapters,
  generateExamplesReference: generateExamplesReference,
};

/*
Pruebas de verificación (ejemplo con Node assert):

const assert = require('assert');
const { generateExamplesReference, chapters } = require('./make-documentation');

assert.ok(Array.isArray(chapters));
assert.ok(chapters.some(c => c.id === 'examples'), 'Debe existir el capítulo examples');
const ref = generateExamplesReference();
assert.ok(typeof ref === 'string' && ref.startsWith('# Examples'));
assert.ok(ref.includes('| Ejemplo | Descripción |'));
*/