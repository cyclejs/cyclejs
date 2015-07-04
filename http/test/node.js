'use strict';

var uri = 'http://localhost:5000';
process.env.ZUUL_PORT = 5000;
require('./support/server');
require('./common')(uri);
