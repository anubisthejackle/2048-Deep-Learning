const EventEmitter = require('voltrevo-event-emitter');

const AbbreviationWarning = require('./html/AbbreviationWarning.html');
const Board = require('./Board.js');
const cellsToSeed = require('./cellsToSeed.js');
const Grid = require('./grid.js');
const MeetTransport = require('./raceProtocol/MeetTransport.js');
const MoveStore = require('./MoveStore.js');
const onceLater = require('./onceLater.js');
const Tile = require('./tile.js');
const race = require('./raceProtocol/race.js');
const rand = require('./rand.js');
const stringToSeed = require('./stringToSeed.js');

function incrementStartMoves(startMoves) {
  let i = 0;

  for (; i !== startMoves.length; i++) {
    // eslint-disable-next-line
    startMoves[i]++;

    if (startMoves[i] !== 4) {
      break;
    }

    // eslint-disable-next-line
    startMoves[i] = 0;
  }

  if (i === startMoves.length) {
    startMoves.push(0);
  }
}

const GameManager = function GameManager({
  size,
  gameSeed,
  moveStore,
  InputManager,
  Actuator,
  StorageManager,
  getSuggestion,
}) {
  this.size = size; // Size of the grid
  this.gameSeed = gameSeed;
  this.inputManager = new InputManager;
  this.storageManager = new StorageManager;
  this.actuator = new Actuator;
  this.getSuggestion = getSuggestion;
  this.moveStore = moveStore;
  this.history = [];
  this.events = EventEmitter();

  this.startTiles = 2;

  this.inputManager.on('move', this.move.bind(this));
  this.inputManager.on('restart', this.restart.bind(this));
  this.inputManager.on('keepPlaying', this.keepPlaying.bind(this));
  this.inputManager.on('undo', this.popHistory.bind(this));
  this.inputManager.on('acceptSuggestion', this.acceptSuggestion.bind(this));
  this.inputManager.on('toggleRun', this.toggleRun.bind(this));

  this.moveStore.events.once('abbreviation', () => {
    document.querySelector('#dynamic-info-box').appendChild(
      AbbreviationWarning()
    );
  });

  window.addEventListener('hashchange', this.updateFromHash.bind(this));

  // If actuate is called many times quickly, it'll ignore all but the last call
  this.actuating = false;
  const oldActuate = onceLater(this.actuate.bind(this));

  this.actuate = () => {
    this.actuating = true;
    oldActuate().then(() => {
      this.actuating = false;
    });
  };

  document.querySelector('#reload').addEventListener('click', () => {
    this.actuator.updateSuggestion(
      this.getSuggestion ?
      this.getSuggestion(this.createBoard()) :
      ''
    );
  });

  this.setup();
  this.canRun = true;

  // document.querySelector('#start-battle-button').addEventListener('click', () => {
  //   this.startBattle();
  // });
};

GameManager.prototype.startBattle = function startBattle() {
  const arena = document.querySelector('#arena-text').value;

  const goalSelect = document.querySelector('#goal-select');
  const goal = [256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536][goalSelect.selectedIndex];

  const battleStatus = document.querySelector('#battle-status');

  battleStatus.textContent = 'Connecting...';

  MeetTransport(`${arena}-${goal}`)
    .then(meetTransport => {
      battleStatus.textContent = 'Connected, waiting for peer';

      const send = meetTransport.send;
      meetTransport.send = msg => {
        console.log('sending: ' + msg);
        send(msg);
      };

      meetTransport.events.on('message', msg => console.log('received: ' + msg));

      const outcomes = {
        win: 0,
        lose: 0,
        draw: 0,
      };

      const raceLoop = () => {
        battleStatus.textContent = (
          `Battling! W: ${outcomes.win}, L: ${outcomes.lose}, D: ${outcomes.draw}`
        );

        race(meetTransport, this.Solver(goal)).then(outcome => {
          outcomes[outcome]++;
          raceLoop();
        });
      };

      raceLoop();
    })
    .catch(err => {
      battleStatus.textContent = err.stack;
    })
  ;
};

GameManager.prototype.Solver = function Solver(targetBlock) {
  const solver = {};

  solver.solve = ({coRand}) => {
    const result = {};

    result.promise = new Promise((resolve, reject) => {
      if (this.running) {
        reject(new Error('Already running'));
        return;
      }

      this.gameSeed = coRand;

      this.restart();
      this.toggleRun();

      const startMoves = [];

      let stuckListener;

      const stuckHandler = () => {
        stuckListener.remove();
        this.running = false;
        this.restart();
        this.keepPlaying = true;
        incrementStartMoves(startMoves);

        let i = 0;
        const intervalId = setInterval(() => {
          if (i === startMoves.length) {
            clearInterval(intervalId);

            stuckListener = this.events.once('stuck', stuckHandler);
            this.toggleRun();

            return;
          }

          this.move(startMoves[i]);
          i++;
        }, 100);
      };

      stuckListener = this.events.on('stuck', stuckHandler);

      const movedListener = this.events.on('moved', () => {
        if ([].concat(...this.getPlainCells()).indexOf(targetBlock) !== -1) {
          this.running = false;
          this.moveStore.resolve().then(moves => {
            movedListener.remove();
            stuckListener.remove();
            resolve(moves);
          });
        }
      });

      result.cancel = () => {
        this.running = false;
        movedListener.remove();
        stuckListener.remove();
      };
    });

    return result;
  };

  solver.validate = ({coRand}, solution) => {
    const board = Board({gameSeed: coRand});

    solution.split('').forEach(moveChar => {
      board[{
        l: 'left',
        r: 'right',
        u: 'up',
        d: 'down',
      }[moveChar]]();
    });

    return ([].concat(...board.getCells()).indexOf(targetBlock) !== -1);
  };

  return solver;
};

// Restart the game
GameManager.prototype.restart = function restart() {
  this.actuator.continueGame(); // Clear the game won/lost message
  this.moveStore.set('');
  this.history = [];
  this.setup();
};

// Keep playing after winning (allows going over 2048)
GameManager.prototype.keepPlaying = function keepPlaying() {
  this.keepPlaying = true;
  this.actuator.continueGame(); // Clear the game won/lost message
};

// Return true if the game is lost, or has won and the user hasn't kept playing
GameManager.prototype.isGameTerminated = function isGameTerminated() {
  return this.over || (this.won && !this.keepPlaying);
};

GameManager.prototype.replaySequence = function replaySequence(moves, record = true) {
  moves.split('').forEach(moveLetter => {
    if (this.won) {
      this.keepPlaying = true;
    }

    this.move('urdl'.indexOf(moveLetter), record);
  });
};

// Set up the game
GameManager.prototype.setup = function setup() {
  this.grid = new Grid(this.size);
  this.score = 0;
  this.over = false;
  this.won = false;
  this.keepPlaying = false;
  this.history = [];

  // Add the initial tiles
  this.addStartTiles();
  this.pushHistory();

  this.moveStore.resolve().then(moves => {
    this.replaySequence(moves, false);

    // Update the actuator
    this.actuate();
  });
};

// Set up the initial tiles to start the game with
GameManager.prototype.addStartTiles = function addStartTiles() {
  for (let i = 0; i < this.startTiles; i++) {
    this.addRandomTile();
  }
};

// Adds a tile in a random position
GameManager.prototype.addRandomTile = function addRandomTile() {
  if (this.grid.cellsAvailable()) {
    // Extract both random decisions from the same rand value.
    let randVal = rand(stringToSeed(this.gameSeed) + this.getStateSeed());
    randVal *= 10;

    const value = (randVal < 1 ? 4 : 2);
    randVal = randVal - Math.floor(randVal);

    const tile = new Tile(this.grid.randomAvailableCell(randVal), value);

    this.grid.insertTile(tile);
  }
};

// Sends the updated grid to the actuator
GameManager.prototype.actuate = function actuate() {
  if (this.storageManager.getBestScore() < this.score) {
    this.storageManager.setBestScore(this.score);
  }

  window.location.hash = `#${this.gameSeed},${this.moveStore.get()}`;

  this.actuator.actuate(this.grid, {
    score: this.score,
    over: this.over,
    won: this.won,
    bestScore: this.storageManager.getBestScore(),
    terminated: this.isGameTerminated(),
    suggestion: this.getSuggestion ? this.getSuggestion(this.createBoard()) : '',
  });
};

// Represent the current game as an object
GameManager.prototype.serialize = function serialize() {
  return {
    grid: this.grid.serialize(),
    score: this.score,
    over: this.over,
    won: this.won,
    keepPlaying: this.keepPlaying,
  };
};

// Save all tile positions and remove merger info
GameManager.prototype.prepareTiles = function prepareTiles() {
  this.grid.eachCell((x, y, tile) => {
    if (tile) {
      /* eslint-disable no-param-reassign */ // FIXME
      tile.mergedFrom = null;
      /* eslint-enable no-param-reassign */
      tile.savePosition();
    }
  });
};

// Move a tile and its representation
GameManager.prototype.moveTile = function moveTile(tile, cell) {
  this.grid.cells[tile.x][tile.y] = null;
  this.grid.cells[cell.x][cell.y] = tile;
  tile.updatePosition(cell);
};

// Move tiles on the grid in the specified direction
GameManager.prototype.move = function move(direction, record = true) {
  // 0: up, 1: right, 2: down, 3: left
  const self = this;

  if (this.isGameTerminated()) return; // Don't do anything if the game's over

  const vector = this.getVector(direction);
  const traversals = this.buildTraversals(vector);
  let moved = false;

  // Save the current tile positions and remove merger information
  this.prepareTiles();

  // Traverse the grid in the right direction and move tiles
  traversals.x.forEach((x) => {
    traversals.y.forEach((y) => {
      const cell = { x, y };
      const tile = self.grid.cellContent(cell);

      if (tile) {
        const positions = self.findFarthestPosition(cell, vector);
        const next = self.grid.cellContent(positions.next);

        // Only one merger per row traversal?
        if (next && next.value === tile.value && !next.mergedFrom) {
          const merged = new Tile(positions.next, tile.value * 2);
          merged.mergedFrom = [tile, next];

          self.grid.insertTile(merged);
          self.grid.removeTile(tile);

          // Converge the two tiles' positions
          tile.updatePosition(positions.next);

          // Update the score
          self.score += merged.value;

          // The mighty 2048 tile
          if (merged.value === 2048) self.won = true;
        } else {
          self.moveTile(tile, positions.farthest);
        }

        if (!self.positionsEqual(cell, tile)) {
          moved = true; // The tile moved from its original cell!
        }
      }
    });
  });

  if (moved) {
    this.addRandomTile();

    if (record) {
      this.moveStore.append('urdl'[direction]);
    }

    this.pushHistory();

    if (!this.keepPlaying && !this.movesAvailable()) {
      this.over = true; // Game over!
    }

    this.actuate();
    this.events.emit('moved');
  } else {
    this.events.emit('stuck');
  }
};

// Get the vector representing the chosen direction
GameManager.prototype.getVector = function getVector(direction) {
  // Vectors representing tile movement
  const map = {
    0: { x: 0, y: -1 }, // Up
    1: { x: 1, y: 0 },  // Right
    2: { x: 0, y: 1 },  // Down
    3: { x: -1, y: 0 }, // Left
  };

  return map[direction];
};

// Build a list of positions to traverse in the right order
GameManager.prototype.buildTraversals = function buildTraversals(vector) {
  const traversals = { x: [], y: [] };

  for (let pos = 0; pos < this.size; pos++) {
    traversals.x.push(pos);
    traversals.y.push(pos);
  }

  // Always traverse from the farthest cell in the chosen direction
  if (vector.x === 1) traversals.x = traversals.x.reverse();
  if (vector.y === 1) traversals.y = traversals.y.reverse();

  return traversals;
};

GameManager.prototype.findFarthestPosition = function findFarthestPosition(cellInput, vector) {
  let previous;
  let cell = cellInput;

  // Progress towards the vector direction until an obstacle is found
  do {
    previous = cell;
    cell = { x: previous.x + vector.x, y: previous.y + vector.y };
  } while (
    this.grid.withinBounds(cell) &&
    this.grid.cellAvailable(cell)
  );

  return {
    farthest: previous,
    next: cell, // Used to check if a merge is required
  };
};

GameManager.prototype.movesAvailable = function movesAvailable() {
  return this.grid.cellsAvailable() || this.tileMatchesAvailable();
};

// Check for available matches between tiles (more expensive check)
GameManager.prototype.tileMatchesAvailable = function tileMatchesAvailable() {
  const self = this;

  for (let x = 0; x < this.size; x++) {
    for (let y = 0; y < this.size; y++) {
      const tile = this.grid.cellContent({ x, y });

      if (tile) {
        for (let direction = 0; direction < 4; direction++) {
          const vector = self.getVector(direction);
          const cell = { x: x + vector.x, y: y + vector.y };

          const other = self.grid.cellContent(cell);

          if (other && other.value === tile.value) {
            return true; // These two tiles can be merged
          }
        }
      }
    }
  }

  return false;
};

GameManager.prototype.positionsEqual = function positionsEqual(first, second) {
  return first.x === second.x && first.y === second.y;
};

GameManager.prototype.getState = function getState() {
  return {
    cells: this.grid.serialize().cells,
    score: this.score,
  };
};

GameManager.prototype.pushHistory = function pushHistory() {
  this.history.push(this.getState());
};

GameManager.prototype.stateTransition = function stateTransition(prevState, currState) {
  this.grid.cells = this.grid.fromState(currState.cells);

  for (let x = 0; x !== this.size; x++) {
    for (let y = 0; y !== this.size; y++) {
      const prevTile = prevState.cells[x][y];
      const currTile = currState.cells[x][y];

      if (prevTile && currTile && prevTile.value === currTile.value) {
        this.grid.cells[x][y].savePosition();
      }
    }
  }

  this.score = currState.score;
  this.over = !this.movesAvailable();
};

GameManager.prototype.popHistory = function popHistory() {
  // Ignore if there won't be any state left.
  if (this.history.length <= 1) {
    return;
  }

  const prevState = this.history.pop();
  const currState = this.history[this.history.length - 1];

  this.stateTransition(prevState, currState);

  this.moveStore.shorten(1);

  this.actuate();
};

const longestCommonPrefix = (str1, str2) => {
  let i = 0;
  const minLen = Math.min(str1.length, str2.length);

  while (i < minLen && str1[i] === str2[i]) {
    i++;
  }

  return str1.slice(0, i);
};

GameManager.prototype.updateFromHash = function updateFromHash() {
  const [gameSeed = '', moveString = ''] = window.location.hash.slice(1).split(',');

  if (gameSeed !== this.gameSeed) {
    this.gameSeed = gameSeed;
    this.moveStore.set(moveString);

    this.setup();
  } else if (moveString !== this.moveStore.get()) {
    Promise.all([
      this.moveStore.resolve(),
      MoveStore(moveString).resolve(),
    ]).then(([oldMoves, newMoves]) => {
      const commonMoves = longestCommonPrefix(oldMoves, newMoves);
      const extraMoves = newMoves.slice(commonMoves.length);

      const prevState = this.getState();
      this.history = this.history.slice(0, commonMoves.length + 1);
      this.replaySequence(extraMoves);

      const currState = this.history[this.history.length - 1];
      this.stateTransition(prevState, currState);
      this.moveStore.set(moveString);

      this.actuate();
    });
  }
};

GameManager.prototype.getPlainCells = function getPlainCells() {
  return this.grid.cells.map(col => col.map(tile => tile ? tile.value : 0));
};

GameManager.prototype.createBoard = function createBoard() {
  return Board({
    gameSeed: this.gameSeed,
    cells: this.getPlainCells(),
  });
};

GameManager.prototype.acceptSuggestion = function acceptSuggestion() {
  if (!this.getSuggestion) {
    return;
  }

  if (this.actuating) {
    return;
  }

  const suggestion = this.getSuggestion(this.createBoard());
  const moveIndex = ['up', 'right', 'down', 'left'].indexOf(suggestion);

  if (moveIndex !== -1) {
    this.move(moveIndex);
  } else {
    this.actuate();
    this.events.emit('stuck');
  }
};

GameManager.prototype.getStateSeed = function getStateSeed() {
  return cellsToSeed(this.getPlainCells());
};

GameManager.prototype.toggleRun = function run() {
  this.keepPlaying = true;

  if (this.running === true) {
    this.running = false;
    return;
  }

  this.running = true;

  const loop = () => {
    if (!this.running) {
      return;
    }

    setTimeout(() => {
      this.acceptSuggestion();
      requestAnimationFrame(loop);
    });
  };

  requestAnimationFrame(loop);
};

module.exports = GameManager;
