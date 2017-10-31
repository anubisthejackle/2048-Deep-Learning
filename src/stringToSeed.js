'use strict';

const sqrt2 = Math.sqrt(2);

module.exports = (str) => {
  let seed = 0;

  for (let i = 0; i !== str.length; i++) {
    seed += (1 + i) * str.charCodeAt(i);
  }

  seed *= sqrt2;
  seed -= Math.floor(seed);

  return seed;
};
