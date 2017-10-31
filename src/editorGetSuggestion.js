'use strict';

function blockTrim(str) {
  const lines = str.split('\n');

  while (lines.length > 0 && lines[0].trim() === '') {
    lines.shift();
  }

  while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
    lines.pop();
  }

  const minIndent = lines
    .filter(line => line.trim() !== '')
    .map(line => line.match(/^ */)[0].length)
    .reduce((x, y) => Math.min(x, y))
  ;

  return lines
    .map(line => line.slice(minIndent))
    .join('\n')
  ;
}

function cacheLast(fn) {
  const cache = {input: {}};

  return (input) => {
    if (input === cache.input) {
      return cache.output;
    }

    cache.input = input;
    cache.output = fn(cache.input);

    return cache.output;
  };
}

module.exports = (editor) => {
  if (localStorage.getItem('getSuggestionCode') === null) {
    localStorage.setItem('getSuggestionCode', blockTrim(`
      return (board) => {
        const movePriority = ['right', 'down', 'up', 'left'];

        for (let i = 0; i !== movePriority.length; i++) {
          const move = movePriority[i];

          if (board[move]()) {
            return move;
          }
        }

        // Nowhere to go, but still need to return something
        return 'right';
      };
    `));
  }

  editor.setValue(localStorage.getItem('getSuggestionCode'));

  editor.on('change', () => {
    localStorage.setItem('getSuggestionCode', editor.getValue());
  });

  const getGetSuggestion = cacheLast((code) => {
    let getSuggestion;

    try {
      // eslint-disable-next-line
      getSuggestion = new Function(code);
    } catch (e) {
      getSuggestion = () => () => e.stack;
    }

    return getSuggestion();
  });

  return (board) => {
    const getSuggestion = getGetSuggestion(editor.getValue());

    return getSuggestion(board);
  };
};
