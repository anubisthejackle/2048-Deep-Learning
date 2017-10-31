'use strict';

const test = require('tape');

const TransportPair = require('./TransportPair.js');
const race = require('./race.js');

test('can send message', t => {
  t.plan(1);

  const [a, b] = TransportPair();

  a.send('foo');

  b.events.on('message', msg => {
    t.equal(msg, 'foo');
  });
});

test('race with contrived problem', t => {
  t.plan(1);

  const Solver = () => {
    const solver = {};

    solver.solve = () => {
      const promise = new Promise(resolve => {
        setTimeout(() => {
          resolve('valid solution');
        }, 3000);
      });

      const cancel = () => {};

      return {promise, cancel};
    };

    solver.validate = (seeds, msg) => msg === 'valid solution';

    return solver;
  };

  const pair = TransportPair();

  Promise.all(pair.map(transport => race(transport, Solver())))
    .then(([aResult, bResult]) => {
      t.equal(bResult, (
        aResult === 'win' ? 'lose' :
        aResult === 'draw' ? 'draw' :
        'win'
      ));
    })
    .catch(err => {
      t.fail(err.stack);
    })
  ;
});
