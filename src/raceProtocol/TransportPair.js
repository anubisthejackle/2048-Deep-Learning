'use strict';

const EventEmitter = require('voltrevo-event-emitter');

const range = require('../range.js');

module.exports = () => {
  const pair = range(2).map(() => ({ events: EventEmitter() }));

  range(2).forEach(i => {
    const curr = pair[i];
    const other = pair[(i + 1) % 2];

    curr.open = true;

    curr.send = msg => other.events.emit('message', msg);

    curr.close = () => {
      curr.events.emit('close');
      other.events.emit('close');
    };

    curr.events.on('close', () => {
      curr.open = false;
    });
  });

  return pair;
};
