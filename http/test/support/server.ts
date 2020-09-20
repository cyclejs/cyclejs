import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';

const app = express();

app.use(function (_req: any, res: any, next: any) {
  res.set('Cache-Control', 'no-cache, no-store');
  next();
});
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

app.get('/', (_req: any, res: any) => {
  res.sendStatus(200);
});

app.get('/hello', function (req: any, res: any) {
  setTimeout(function () {
    const contentTypeHeader = req.get('Content-Type');
    if (!contentTypeHeader) {
      res.send('Hello World');
    } else {
      res
        .status(500)
        .send(
          'Expected Content-Type request header to be undefined, but got ' +
            contentTypeHeader
        );
    }
  }, 150);
});

let petResponse = 'no request yet';
app.get('/petResponse', (req: any, res: any) => {
  res.status(200).send(petResponse);
  petResponse = 'no request yet';
});

app.post('/pet', function (req: any, res: any) {
  setTimeout(function () {
    const result = 'added ' + req.body.name + ' the ' + req.body.species;
    petResponse = result;
    res.status(200).send(result);
  }, 150);
});

app.get('/json', function (req: any, res: any) {
  setTimeout(function () {
    res.status(200).json({ name: 'manny' });
  }, 150);
});

app.get('/querystring', function (req: any, res: any) {
  setTimeout(function () {
    res.send(req.query);
  }, 150);
});

app.get('/error', function (req: any, res: any) {
  setTimeout(function () {
    res.status(500).send('boom');
  }, 150);
});

app.delete('/delete', function (req: any, res: any) {
  setTimeout(function () {
    res.status(200).json({ deleted: true });
  }, 150);
});

app.get('/binary', function (req: any, res: any) {
  setTimeout(function () {
    res.send(Buffer.from([1, 2, 3]));
  }, 150);
});

app.listen(3000);
