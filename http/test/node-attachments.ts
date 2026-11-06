import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {Response} from 'superagent';
import {optionsToSuperagent} from '../src/http-driver';

describe('Node attachment path descriptors', () => {
  let directory: string | undefined;
  let fixture: string | undefined;
  afterEach(() => {
    if (fixture && fs.existsSync(fixture)) {
      fs.unlinkSync(fixture);
    }
    if (directory && fs.existsSync(directory)) {
      fs.rmdirSync(directory);
    }
    fixture = undefined;
    directory = undefined;
  });

  it('uploads real file bytes and preserves the filename override', done => {
    directory = fs.mkdtempSync(
      path.join(os.tmpdir(), 'cycle-http-attachment-')
    );
    fixture = path.join(directory, 'fixture.bin');
    fs.writeFileSync(fixture, Buffer.from([0, 1, 255]));
    optionsToSuperagent({
      url: 'http://localhost:5000/upload',
      method: 'POST',
      attach: [{name: 'upload', path: fixture, filename: 'node-name.bin'}],
    }).end((error: any, response: Response) => {
      if (error) {
        done(error);
        return;
      }
      try {
        assert.strictEqual(response.body[0].name, 'upload');
        assert.strictEqual(response.body[0].filename, 'node-name.bin');
        assert.deepStrictEqual(response.body[0].bytes, [0, 1, 255]);
        done();
      } catch (failure) {
        done(failure);
      }
    });
  });
});
