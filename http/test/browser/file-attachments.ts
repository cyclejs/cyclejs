import 'mocha'; // tslint:disable-line
import * as assert from 'assert';
import xs from 'xstream';
import * as superagent from 'superagent';
import {makeHTTPDriver, RequestInput, RequestOptions} from '../../src/index';

interface UploadPart {
  name: string;
  filename: string;
  type: string;
  bytes: Array<number>;
}

function upload(
  attach: RequestOptions['attach'],
  check: (parts: Array<UploadPart>) => void,
  done: Mocha.Done
) {
  const source = makeHTTPDriver()(
    xs.of<RequestInput>({
      url: '/upload',
      method: 'POST',
      attach,
    })
  );
  source
    .select()
    .take(1)
    .addListener({
      next: responseStream =>
        responseStream.take(1).addListener({
          next: response => {
            try {
              check(response.body);
              done();
            } catch (error) {
              done(error);
            }
          },
          error: done,
          complete: () => {},
        }),
      error: done,
      complete: () => {},
    });
}

describe('native browser File attachments', () => {
  let canConstructFile = false;
  try {
    canConstructFile =
      typeof File === 'function' &&
      new File([''], 'fixture').name === 'fixture';
  } catch (error) {
    // Some older browsers expose File but do not allow constructing fixtures.
  }
  let frame: HTMLIFrameElement | undefined;
  afterEach(() => {
    if (frame && frame.parentNode) {
      frame.parentNode.removeChild(frame);
    }
    frame = undefined;
  });

  it('the multipart fixture receives a native File sent by SuperAgent', function(done) {
    if (!canConstructFile) {
      this.skip();
      return;
    }
    const file = new File(['ok'], 'control.txt', {type: 'text/plain'});
    superagent
      .post('/upload')
      .attach('control', file, file.name)
      .end((error, response) => {
        if (error) {
          done(error);
          return;
        }
        try {
          assert.strictEqual(response.body[0].filename, 'control.txt');
          assert.deepStrictEqual(response.body[0].bytes, [111, 107]);
          done();
        } catch (failure) {
          done(failure);
        }
      });
  });

  it('uploads a native File without a path or filename property', function(done) {
    if (!canConstructFile) {
      this.skip();
      return;
    }
    const file = new File(['alpha'], 'alpha.txt', {type: 'text/plain'});
    upload(
      [file],
      parts => {
        assert.strictEqual(parts.length, 1);
        assert.strictEqual(parts[0].name, 'alpha.txt');
        assert.strictEqual(parts[0].filename, 'alpha.txt');
        assert.deepStrictEqual(parts[0].bytes, [97, 108, 112, 104, 97]);
      },
      done
    );
  });

  it('uploads actual input FileList data including binary bytes', function(done) {
    if (!canConstructFile || typeof DataTransfer !== 'function') {
      this.skip();
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    let transfer: DataTransfer;
    try {
      transfer = new DataTransfer();
    } catch (error) {
      this.skip();
      return;
    }
    transfer.items.add(new File(['a'], 'a.txt', {type: 'text/plain'}));
    transfer.items.add(
      new File([new Uint8Array([0, 255, 16])], 'b.bin', {
        type: 'application/octet-stream',
      })
    );
    input.files = transfer.files;
    upload(
      Array.from(input.files || []),
      parts => {
        parts.sort((a, b) => a.filename.localeCompare(b.filename));
        assert.deepStrictEqual(parts.map(part => part.filename), [
          'a.txt',
          'b.bin',
        ]);
        assert.deepStrictEqual(parts[1].bytes, [0, 255, 16]);
      },
      done
    );
  });

  it('uploads a File from another window realm', function(done) {
    if (!canConstructFile) {
      this.skip();
      return;
    }
    frame = document.createElement('iframe');
    document.body.appendChild(frame);
    const ForeignFile = (frame.contentWindow as Window & {File: typeof File})
      .File;
    if (typeof ForeignFile !== 'function') {
      this.skip();
      return;
    }
    const file = new ForeignFile(['frame'], 'frame.txt', {type: 'text/plain'});
    assert.strictEqual(file instanceof File, false);
    upload(
      [file],
      parts => {
        assert.strictEqual(parts[0].filename, 'frame.txt');
        assert.deepStrictEqual(parts[0].bytes, [102, 114, 97, 109, 101]);
      },
      done
    );
  });

  it('preserves named Blob descriptors and filename overrides', function(done) {
    if (typeof Blob !== 'function') {
      this.skip();
      return;
    }
    upload(
      [
        {
          name: 'attachment',
          path: new Blob(['blob']),
          filename: 'override.txt',
        },
      ],
      parts => {
        assert.strictEqual(parts.length, 1);
        assert.strictEqual(parts[0].name, 'attachment');
        assert.strictEqual(parts[0].filename, 'override.txt');
        assert.deepStrictEqual(parts[0].bytes, [98, 108, 111, 98]);
      },
      done
    );
  });
});
