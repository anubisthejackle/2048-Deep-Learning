const Tile = require('./tile.js');

function Grid(size, previousState) {
  this.size = size;
  this.cells = previousState ? this.fromState(previousState) : this.empty();
}

// Build a grid of the specified size
Grid.prototype.empty = function empty() {
  const cells = [];

  for (let x = 0; x < this.size; x++) {
    const row = cells[x] = [];

    for (let y = 0; y < this.size; y++) {
      row.push(null);
    }
  }

  return cells;
};

Grid.prototype.fromState = function fromState(state) {
  const cells = [];

  for (let x = 0; x < this.size; x++) {
    const row = cells[x] = [];

    for (let y = 0; y < this.size; y++) {
      const tile = state[x][y];
      row.push(tile ? new Tile(tile.position, tile.value) : null);
    }
  }

  return cells;
};

// Find the first available random position
Grid.prototype.randomAvailableCell = function randomAvailableCell(randVal) {
  const cells = this.availableCells();

  return cells[Math.floor(randVal * cells.length)];
};

Grid.prototype.availableCells = function availableCells() {
  const cells = [];

  this.eachCell((x, y, tile) => {
    if (!tile) {
      cells.push({ x, y });
    }
  });

  return cells;
};

// Call callback for every cell
Grid.prototype.eachCell = function eachCell(callback) {
  for (let x = 0; x < this.size; x++) {
    for (let y = 0; y < this.size; y++) {
      callback(x, y, this.cells[x][y]);
    }
  }
};

// Check if there are any cells available
Grid.prototype.cellsAvailable = function cellsAvailable() {
  return !!this.availableCells().length;
};

// Check if the specified cell is taken
Grid.prototype.cellAvailable = function cellAvailable(cell) {
  return !this.cellOccupied(cell);
};

Grid.prototype.cellOccupied = function cellOccupied(cell) {
  return !!this.cellContent(cell);
};

Grid.prototype.cellContent = function cellContent(cell) {
  if (this.withinBounds(cell)) {
    return this.cells[cell.x][cell.y];
  }

  return null;
};

// Inserts a tile at its position
Grid.prototype.insertTile = function insertTile(tile) {
  this.cells[tile.x][tile.y] = tile;
};

Grid.prototype.removeTile = function removeTile(tile) {
  this.cells[tile.x][tile.y] = null;
};

Grid.prototype.withinBounds = function withinBounds(position) {
  return position.x >= 0 && position.x < this.size &&
         position.y >= 0 && position.y < this.size;
};

Grid.prototype.serialize = function serialize() {
  const cellState = [];

  for (let x = 0; x < this.size; x++) {
    const row = cellState[x] = [];

    for (let y = 0; y < this.size; y++) {
      row.push(this.cells[x][y] ? this.cells[x][y].serialize() : null);
    }
  }

  return {
    size: this.size,
    cells: cellState,
  };
};

module.exports = Grid;
