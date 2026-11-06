'use strict';

const path = require('path');
const root = path.resolve(__dirname, '..');
process.chdir(root);
const {Server} = require('karma');
const express = require('express');
const multipart = require('./support/multipart');

async function main() {
  if (!process.env.CHROME_BIN)
    throw new Error(
      'Set CHROME_BIN to an installed Chrome/Chromium executable'
    );
  const app = express();
  app.post('/upload', multipart);
  const listener = app.listen(0, '127.0.0.1');
  const sockets = new Set();
  listener.on('connection', socket => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
  });
  try {
    await new Promise((resolve, reject) => {
      listener.once('listening', resolve);
      listener.once('error', reject);
    });
    const code = await new Promise(resolve => {
      new Server(
        {
          configFile: path.join(root, 'karma.conf.js'),
          basePath: root,
          files: [
            {pattern: 'src/**/*.ts'},
            {pattern: 'test/browser/file-attachments.ts'},
          ],
          browsers: ['ChromeHeadless'],
          reporters: ['dots'],
          hostname: '127.0.0.1',
          listenAddress: '127.0.0.1',
          port: Number(process.env.UPLOAD_KARMA_PORT || 19877),
          singleRun: true,
          autoWatch: false,
          browserNoActivityTimeout: 30000,
          captureTimeout: 15000,
          proxies: {
            '/upload': {
              target: 'http://127.0.0.1:' + listener.address().port + '/upload',
              changeOrigin: true,
            },
          },
          karmaTypescriptConfig: {
            tsconfig: './tsconfig.json',
            include: {
              mode: 'replace',
              values: ['src/**/*.ts', 'test/browser/file-attachments.ts'],
            },
            coverageOptions: {exclude: /test\//},
          },
        },
        resolve
      ).start();
    });
    process.exitCode = code;
  } finally {
    await new Promise(resolve => {
      listener.close(resolve);
      for (const socket of sockets) socket.destroy();
    });
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
