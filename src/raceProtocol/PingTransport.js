'use strict';

const EventEmitter = require('voltrevo-event-emitter');

module.exports = (transport, pingId, period, timeout) => {
  const pt = {};

  pt.events = EventEmitter();

  let timeoutId;

  const refreshTimeout = () => {
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      pt.events.emit('timeout');
      pt.close();
    }, timeout);
  };

  pt.events.on('message', refreshTimeout);

  const intervalId = setInterval(() => {
    pt.send(`${pingId}`);
  }, period);

  pt.events.on('close', () => clearInterval(intervalId));

  pt.open = true;
  pt.events.on('close', () => { pt.open = false; });

  transport.events.on('message', msg => {
    if (msg !== pingId) {
      pt.events.emit('message', msg);
    }
  });

  transport.events.on('close', () => pt.events.emit('close'));

  pt.send = transport.send;
  pt.close = transport.close;

  return pt;
};
