'use strict';

const assert = require('assert');

const cellsToSeed = require('./cellsToSeed.js');
const rand = require('./rand.js');
const range = require('./range.js');
const stringToSeed = require('./stringToSeed.js');

const copyCells = (cells) => (
  cells.map(row => row.map(cell => cell))
);

const repeatStr = (str, n) => {
  let result = '';

  for (let i = 0; i < n; i++) {
    result += str;
  }

  return result;
};

const padNum = (n, len) => {
  const nStr = String(n);

  return repeatStr(' ', len - nStr.length) + nStr;
};

const Board = (argInput) => {
  // This is a workaround for browserify's parser and nodejs not supporting this type of argument
  // destructuring: ({ x = 1, y = 2 } = {}) => x + y;
  const arg = argInput || {};
  const gameSeed = arg.gameSeed || '';
  const inputCells = arg.cells || range(4).map(() => [0, 0, 0, 0]);

  const board = {};

  const cells = copyCells(inputCells);

  board.getCells = () => copyCells(cells);

  const countEmptyCells = () => {
    let count = 0;

    for (let x = 0; x !== 4; x++) {
      for (let y = 0; y !== 4; y++) {
        if (cells[x][y] === 0) {
          count++;
        }
      }
    }

    return count;
  };

  const insertRandomBlock = () => {
    const emptyCount = countEmptyCells();

    if (emptyCount === 0) {
      return false;
    }

    // Extract both random decisions from the same rand value.
    let randVal = rand(stringToSeed(gameSeed) + cellsToSeed(cells));
    randVal *= 10;

    const blockVal = (randVal < 1 ? 4 : 2);
    randVal = randVal - Math.floor(randVal);

    const blockIndex = Math.floor(emptyCount * randVal);

    let emptySoFar = 0;

    for (let x = 0; x !== 4; x++) {
      for (let y = 0; y !== 4; y++) {
        if (cells[x][y] === 0) {
          if (emptySoFar === blockIndex) {
            cells[x][y] = blockVal;
            return true;
          }

          emptySoFar++;
        }
      }
    }

    assert(false);
    return undefined;
  };

  // If the board is empty, insert two random blocks
  if (countEmptyCells() === 16) {
    range(2).forEach(insertRandomBlock);
  }

  const collapseUp = (get, set) => {
    let changed = false;

    for (let x = 0; x !== 4; x++) {
      const row = range(4).map(y => get(x, y));
      const filteredRow = row.filter(v => v !== 0);
      const newRow = [];

      (() => {
        let y = 0;

        while (y < filteredRow.length) {
          if (filteredRow[y] === filteredRow[y + 1]) {
            newRow.push(2 * filteredRow[y]);
            y += 2;
          } else {
            newRow.push(filteredRow[y]);
            y += 1;
          }
        }
      })();

      const paddedNewRow = range(4).map(y => newRow[y] || 0);

      range(4).forEach(y => {
        if (row[y] !== paddedNewRow[y]) {
          changed = true;
        }
      });

      range(4).forEach(y => set(x, y, paddedNewRow[y]));
    }

    return changed;
  };

  board.left = () => (
    collapseUp(
      (x, y) => cells[y][x],
      (x, y, v) => { cells[y][x] = v; }
    ) &&
    insertRandomBlock()
  );

  board.right = () => (
    collapseUp(
      (x, y) => cells[3 - y][x],
      (x, y, v) => { cells[3 - y][x] = v; }
    ) &&
    insertRandomBlock()
  );

  board.up = () => (
    collapseUp(
      (x, y) => cells[x][y],
      (x, y, v) => { cells[x][y] = v; }
    ) &&
    insertRandomBlock()
  );

  board.down = () => (
    collapseUp(
      (x, y) => cells[x][3 - y],
      (x, y, v) => { cells[x][3 - y] = v; }
    ) &&
    insertRandomBlock()
  );

  board.clone = () => Board({ gameSeed, cells });

  ['Left', 'Right', 'Up', 'Down'].forEach(direction => {
    board[`clone${direction}`] = () => {
      const newBoard = board.clone();
      const success = newBoard[direction.toLowerCase()]();

      return success ? newBoard : null;
    };
  });

  board.prettyString = () => {
    const maxLen = (Array.prototype.concat.apply([], cells)
      .map(n => String(n).length)
      .reduce((a, b) => Math.max(a, b))
    );

    const horizBorder = `+${repeatStr('-', 4 * (maxLen + 2))}+\n`;

    let result = horizBorder;

    // This is why arrays are meant to be indexed by i and j, not x and y.
    for (let y = 0; y !== 4; y++) {
      result += '|';

      for (let x = 0; x !== 4; x++) {
        result += ` ${padNum(cells[x][y], maxLen)} `;
      }

      result += '|\n';
    }

    result += horizBorder;

    return result;
  };

  board.isEqualTo = (otherBoard) => {
    const otherCells = otherBoard.getCells();

    for (let y = 0; y !== 4; y++) {
      for (let x = 0; x !== 4; x++) {
        if (cells[x][y] !== otherCells[x][y]) {
          return false;
        }
      }
    }

    return true;
  };

  return board;
};

module.exports = Board;
