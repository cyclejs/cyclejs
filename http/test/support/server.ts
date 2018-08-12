import express = require('express');
import bodyParser = require('body-parser');
import cookieParser = require('cookie-parser');
import {globalSandbox} from './global';

export function startServer() {
  const app = express();

  app.use(function(req: any, res: any, next: any) {
    res.set('Cache-Control', 'no-cache, no-store');
    next();
  });
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(bodyParser.json());
  app.use(cookieParser());

  app.get('/hello', function(req: any, res: any) {
    setTimeout(function() {
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

  app.post('/pet', function(req: any, res: any) {
    setTimeout(function() {
      const result = 'added ' + req.body.name + ' the ' + req.body.species;
      globalSandbox.petPOSTResponse = result;
      res.send(result);
    }, 150);
  });

  app.get('/json', function(req: any, res: any) {
    setTimeout(function() {
      res.status(200).json({name: 'manny'});
    }, 150);
  });

  app.get('/querystring', function(req: any, res: any) {
    setTimeout(function() {
      res.send(req.query);
    }, 150);
  });

  app.get('/error', function(req: any, res: any) {
    setTimeout(function() {
      res.status(500).send('boom');
    }, 150);
  });

  app.delete('/delete', function(req: any, res: any) {
    setTimeout(function() {
      res.status(200).json({deleted: true});
    }, 150);
  });

  app.get('/binary', function(req: any, res: any) {
    setTimeout(function() {
      const result = new Buffer([1, 2, 3]);
      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Length': result.byteLength,
      });
      res.status(200).write(result, 'binary');
    }, 150);
  });

  app.listen(process.env.PORT);
}
