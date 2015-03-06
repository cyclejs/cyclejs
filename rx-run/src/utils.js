'use strict';

function endsWithDollarSign(str) {
  if (typeof str !== 'string') {
    return false;
  }
  return str.indexOf('$', str.length - 1) !== -1;
}

module.exports = {
  endsWithDollarSign: endsWithDollarSign
};
