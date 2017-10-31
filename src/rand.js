'use strict';

const offset = (() => {
  let val = Math.sqrt(2);
  val *= 10000;
  val -= Math.floor(val);

  return val;
})();

// These are not high quality random numbers but that doesn't matter to us and they are generated
// much faster than the high quality random numbers I was getting from the random-seed npm package.
module.exports = (seed) => {
  // Avoid getting hit by edge cases like 0 or 1 by adding a weird offset.
  let rand = seed + offset;

  for (let i = 0; i !== 10; ++i) {
    rand -= (rand * rand + 1) / (2 * rand);
  }

  rand *= 10000;

  return rand - Math.floor(rand);
};
