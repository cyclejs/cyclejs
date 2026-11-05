'use strict';

var markdox = require('markdox');
var fs = require('fs');
var ejs = require('ejs');
var path = require('path');

var template = ejs.compile(
  fs.readFileSync(__dirname + '/../docs/.scripts/template.html', 'utf-8')
);

var argPackage = process.argv[2];
var dirOfThePackage = __dirname + '/../' + argPackage;
var generateDevDocs = process.argv.includes('--devdocs') || process.argv.includes('-d');

function extractKeywords(content) {
  var keywords = new Set();
  var patterns = [
    /(?:function|class|interface|type)\s+(\w+)/g,
    /(?:export|export default|export const|export function|export class)\s+(?:function|class|const|let|var)?\s*(\w+)/g,
    /(?:@param|@returns|@throws|@type)\s+\{?(\w+)\}?\s*(\w+)?/g
  ];

  patterns.forEach(function(pattern) {
    var m;
    while ((m = pattern.exec(content)) !== null) {
      for (var i = 1; i < m.length; i++) {
        if (m[i] && m[i].length > 2) {
          keywords.add(m[i]);
        }
      }
    }
    pattern.lastIndex = 0;
  });

  return Array.from(keywords).slice(0, 50);
}

function getPackageVersion(packageName) {
  try {
    var packageJsonPath = __dirname + '/../' + packageName + '/package.json';
    if (fs.existsSync(packageJsonPath)) {
      var packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      return packageJson.version || null;
    }
  } catch (err) {
    console.warn('Could not read package version for ' + packageName);
  }
  return null;
}

function createDevDocsDocument(name, title, content, keywords) {
  return {
    name: name,
    title: title,
    content: content,
    keywords: keywords,
    category: 'javascript',
    type: 'library',
    generated: new Date().toISOString(),
    version: getPackageVersion(name)
  };
}

function saveDevDocsFile(packageName, devdocsDoc) {
  var devdocsDir = __dirname + '/../docs/devdocs';
  if (!fs.existsSync(devdocsDir)) {
    fs.mkdirSync(devdocsDir, { recursive: true });
  }
  var devdocsPath = path.join(devdocsDir, packageName + '.json');
  fs.writeFileSync(devdocsPath, JSON.stringify(devdocsDoc, null, 2), 'utf-8');
  console.log('DevDocs file `' + devdocsPath + '` generated with success');
}

function generateDocumentation() {
  if (!argPackage) {
    console.error('Error: Package name is required');
    console.error('Usage: node .scripts/make-api-docs.js <package-name> [--devdocs]');
    process.exit(1);
  }

  var sourceFile = dirOfThePackage + '/lib/cjs/index.js';
  if (!fs.existsSync(sourceFile)) {
    console.error('Error: Source file not found: ' + sourceFile);
    process.exit(1);
  }

  markdox.process(
    sourceFile,
    {
      output: dirOfThePackage + '/generated-api.md',
      template: __dirname + '/api-ref-template.md.ejs',
    },
    function generationCallback(err, output) {
      if (err) {
        console.error('Error generating API documentation:', err);
        process.exit(1);
      } else {
        console.log('File `' + dirOfThePackage + '/generated-api.md' + '` generated with success');

        try {
          var existingContent = '';
          var apiContentPath = __dirname + '/../docs/content/api/' + argPackage + '.md';
          if (fs.existsSync(apiContentPath)) {
            existingContent = fs.readFileSync(apiContentPath, 'utf-8');
          }

          var generatedApi = fs.readFileSync(dirOfThePackage + '/generated-api.md', 'utf-8');
          var combinedContent = existingContent + generatedApi;

          var htmlContent = template({
            title: 'API reference (' + argPackage + ')',
            pathToRoot: '../',
            content: combinedContent,
          });

          var htmlFilename = __dirname + '/../docs/api/' + argPackage + '.html';
          var apiDir = path.dirname(htmlFilename);
          if (!fs.existsSync(apiDir)) {
            fs.mkdirSync(apiDir, { recursive: true });
          }
          fs.writeFileSync(htmlFilename, htmlContent, 'utf-8');
          console.log('File `' + htmlFilename + '` generated with success');

          if (generateDevDocs) {
            var keywords = extractKeywords(combinedContent);
            var devdocsDoc = createDevDocsDocument(
              argPackage,
              'API reference (' + argPackage + ')',
              htmlContent,
              keywords
            );
            saveDevDocsFile(argPackage, devdocsDoc);
          }

          fs.unlinkSync(dirOfThePackage + '/generated-api.md');
          console.log('Documentation generation completed successfully');
        } catch (error) {
          console.error('Error during documentation generation:', error);
          if (fs.existsSync(dirOfThePackage + '/generated-api.md')) {
            fs.unlinkSync(dirOfThePackage + '/generated-api.md');
          }
          process.exit(1);
        }
      }
    }
  );
}

if (require.main === module) {
  generateDocumentation();
}

module.exports = {
  generateDocumentation: generateDocumentation,
  extractKeywords: extractKeywords,
  createDevDocsDocument: createDevDocsDocument,
  getPackageVersion: getPackageVersion
};