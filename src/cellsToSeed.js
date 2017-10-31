'use strict';

const sqrt2 = Math.sqrt(2);
const sqrt3 = Math.sqrt(3);

module.exports = (cells) => {
  let seed = 0;

  for (let x = 0; x !== 4; x++) {
    for (let y = 0; y !== 4; y++) {
      seed += (sqrt3 + 4 * x + y) * cells[x][y];
    }
  }

  seed *= sqrt2;
  seed -= Math.floor(seed);

  return seed;
};
