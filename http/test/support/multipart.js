'use strict';

const path = require('path');
const superagent = require.resolve('superagent/package.json');
const {IncomingForm} = require(require.resolve('formidable', {
  paths: [path.dirname(superagent)],
}));

module.exports = function multipart(req, res) {
  const form = new IncomingForm();
  const parts = [];
  let size = 0;
  let ended = false;
  const reply = (status, value) => {
    if (ended) return;
    ended = true;
    res.status(status).json(value);
  };
  // Parse in memory: the fixture must not write uploaded files to disk.
  form.onPart = part => {
    const chunks = [];
    part.on('data', chunk => {
      size += chunk.length;
      if (size > 1024 * 1024) {
        form.emit('error', new Error('Fixture upload limit exceeded'));
      } else {
        chunks.push(chunk);
      }
    });
    part.on('end', () =>
      parts.push({
        name: part.name,
        filename: part.filename || null,
        type: part.mime || null,
        bytes: Array.from(Buffer.concat(chunks)),
      })
    );
  };
  form.on('error', error => reply(400, {error: error.message}));
  form.on('end', () => reply(200, parts));
  form.parse(req);
};
