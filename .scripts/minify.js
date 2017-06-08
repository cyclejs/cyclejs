if (process.argv.length <= 3) {
    console.log("Usage: " + __filename + " inputfile outputfile");
    process.exit(-1);
}
var inputfile = process.argv[2];
var outputfile = process.argv[3];
var compiler = require('google-closure-compiler-js').compile;
var fs = require('fs');
var source = fs.readFileSync(inputfile, 'utf8');

var compilerFlags = {
  jsCode: [{src: source}],
  languageIn: 'ES5'
};

var output = compiler(compilerFlags);
fs.writeFileSync(outputfile, output.compiledCode, 'utf8');
