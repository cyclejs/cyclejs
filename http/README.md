- [**Read the docs here**](https://cycle.js.org/api/http.html)
- [**Edit the docs here**](https://github.com/cyclejs/cyclejs/blob/master/docs/content/api/http.md)

## Browser file uploads

Pass native `File` objects from an input's `FileList` as attachments:

```ts
const request = {
  url: '/upload',
  method: 'POST',
  attach: Array.from(input.files),
};
```

Each native file uses its name for both the multipart field and filename. To
choose a field or filename, use a descriptor instead:

```ts
const request = {
  url: '/upload',
  method: 'POST',
  attach: [{name: 'document', path: file, filename: 'report.txt'}],
};
```

Browser descriptor paths can also be `Blob` objects. Leave `Content-Type` unset
so the browser supplies the multipart boundary. Node descriptors continue to use
filesystem path strings.

## Upload regression tests

With package dependencies installed, set `CHROME_BIN` to a local Chrome executable
and run `pnpm run test-uploads` in this directory. This starts an owned loopback
multipart fixture and Karma, then closes its own server and sockets. No external
upload service or browser download is used. The fixture limits requests to 1 MiB.
Native `File`, cross-window `File`, `FileList`, and named `Blob` uploads are checked
against parsed multipart bytes; unsupported fixture constructors are skipped on
older browsers. The normal Node suite also verifies a real filesystem attachment.
