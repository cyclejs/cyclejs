import assert from 'node:assert/strict';
import {after, before, test} from 'node:test';
import {mkdtemp, mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {chromium} from 'playwright-core';
import {startServer} from '../server.js';

let server;
let browser;
let origin;
let artifacts;
before(async () => {
  assert.ok(
    process.env.CHROME_BIN,
    'Set CHROME_BIN to an installed Chrome/Chromium executable'
  );
  artifacts =
    process.env.EVIDENCE_DIR ||
    (await mkdtemp(path.join(tmpdir(), 'cycle-isomorphic-')));
  await mkdir(artifacts, {recursive: true});
  server = await startServer({port: 0, host: '127.0.0.1'});
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({
    executablePath: process.env.CHROME_BIN,
    headless: true,
  });
});
after(async () => {
  if (browser) await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
});

for (const [name, viewport] of [
  ['desktop', {width: 1280, height: 900}],
  ['mobile', {width: 390, height: 844}],
]) {
  test(`${name}: server HTML survives boot and links navigate without reload`, async () => {
    const context = await browser.newContext({viewport});
    try {
      const page = await context.newPage();
      page.setDefaultTimeout(5000);
      const errors = [];
      const documents = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => {
        if (request.isNavigationRequest()) documents.push(request.url());
      });
      await page.goto(origin, {waitUntil: 'networkidle'});
      await page
        .getByRole('heading', {name: 'The homepage', exact: true})
        .waitFor();
      await page.screenshot({
        path: path.join(artifacts, `${name}-home.png`),
        fullPage: true,
      });
      await page.getByRole('link', {name: 'About', exact: true}).click();
      await page
        .getByRole('heading', {name: 'Read more about us', exact: true})
        .waitFor();
      assert.equal(new URL(page.url()).pathname, '/about');
      assert.equal(
        documents.length,
        1,
        'Client navigation must not fetch another document'
      );
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth
        ),
        true
      );
      await page.screenshot({
        path: path.join(artifacts, `${name}-about.png`),
        fullPage: true,
      });
      await page.goBack();
      await page
        .getByRole('heading', {name: 'The homepage', exact: true})
        .waitFor();
      await page.goForward();
      await page
        .getByRole('heading', {name: 'Read more about us', exact: true})
        .waitFor();
      await page.reload({waitUntil: 'networkidle'});
      await page
        .getByRole('heading', {name: 'Read more about us', exact: true})
        .waitFor();
      await page.getByRole('link', {name: 'Home', exact: true}).click();
      await page
        .getByRole('heading', {name: 'The homepage', exact: true})
        .waitFor();
      assert.equal(new URL(page.url()).pathname, '/');
      assert.deepEqual(errors, []);
    } finally {
      await context.close();
    }
  });
}

test('direct about route is readable with JavaScript disabled', async () => {
  const context = await browser.newContext({javaScriptEnabled: false});
  try {
    const page = await context.newPage();
    await page.goto(origin + '/about');
    await page
      .getByRole('heading', {name: 'Read more about us', exact: true})
      .waitFor();
  } finally {
    await context.close();
  }
});
