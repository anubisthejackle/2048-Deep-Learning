const assert = require('assert');

const EventEmitter = require('voltrevo-event-emitter');
const memoize = require('lodash.memoize');

const range = require('./range.js');

const urlRegex = /(2048|https?):\/\/[^;]+$/;

const arbitraryText = () => (
  range(10).map(() =>
    'abcdefghijklmnopqrstuvwxyz'[Math.floor(26 * Math.random())]
  ).join('')
);

const arbitraryUrl = () => `2048://${arbitraryText()}`;

const localObjects = {
  '': '',
};

const appendLimit = 20000;

const fetchMoves = memoize((url) => (
  (url in localObjects ?
    Promise.resolve(localObjects[url]) :
    (fetch(`https://crossorigin.me/${url}`)
      .then(res => res.text())
      .then(text => text.replace(/[^lrud]/g, ''))
    )
  )
));

const MoveStore = (moves) => {
  const moveStore = {};

  moveStore.events = EventEmitter();

  const data = {};

  moveStore.set = (moveString = '') => {
    if (urlRegex.test(moveString)) {
      data.remote = moveString;
      data.shortenRemote = 0;
      data.append = '';
    } else if (moveString.split(';').length === 3) {
      const parts = moveString.split(';');
      data.remote = parts[0];
      data.shortenRemote = Number(parts[1]);
      data.append = parts[2];
    } else {
      data.remote = '';
      data.shortenRemote = 0;
      data.append = moveString;
    }

    assert(data.remote === '' || urlRegex.test(data.remote));
    assert(typeof data.shortenRemote === 'number');
    assert(data.shortenRemote >= 0);
    assert(/[lrud]*/.test(data.append));
  };

  moveStore.set(moves);

  moveStore.get = () => {
    if (data.remote === '') {
      return data.append;
    }

    if (data.append === '' && data.shortenRemote === 0) {
      return data.remote;
    }

    return [data.remote, data.shortenRemote, data.append].join(';');
  };

  moveStore.shorten = (n) => {
    const appendShortenLen = Math.min(data.append.length, n);
    data.append = data.append.substring(0, data.append.length - appendShortenLen);

    data.shortenRemote += (n - appendShortenLen);
    data.shortenRemote = Math.max(0, data.shortenRemote);
  };

  moveStore.append = (str) => {
    data.append += str;

    if (data.append.length <= appendLimit) {
      return;
    }

    const copy = MoveStore(moveStore.get());

    copy.resolve().then(resolvedMoves => {
      if (copy.get() !== moveStore.get()) {
        moveStore.append(''); // Try again
        return;
      }

      const url = arbitraryUrl();
      localObjects[url] = resolvedMoves;
      data.remote = url;
      data.shortenRemote = 0;
      data.append = '';

      moveStore.events.emit('abbreviation');
    });
  };

  moveStore.resolve = () => (
    fetchMoves(data.remote).then(remoteText => (
      remoteText.substring(0, remoteText.length - data.shortenRemote)
    )).then(shortenedRemoteText =>
      shortenedRemoteText + data.append
    )
  );

  return moveStore;
};

module.exports = MoveStore;
