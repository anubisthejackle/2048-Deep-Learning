function HTMLActuator() {
  this.tileContainer = document.querySelector('.tile-container');
  this.scoreContainer = document.querySelector('.score-container');
  this.bestContainer = document.querySelector('.best-container');
  this.messageContainer = document.querySelector('.game-message');
  this.suggestionContainer = document.querySelector('#suggestion-text');

  this.score = 0;
}

HTMLActuator.prototype.actuate = function actuate(grid, metadata) {
  const self = this;

  window.requestAnimationFrame(() => {
    self.clearContainer(self.tileContainer);
    self.clearMessage();

    grid.cells.forEach((column) => {
      column.forEach((cell) => {
        if (cell) {
          self.addTile(cell);
        }
      });
    });

    self.updateScore(metadata.score);
    self.updateBestScore(metadata.bestScore);

    if (metadata.terminated) {
      if (metadata.over) {
        self.message(false); // You lose
      } else if (metadata.won) {
        self.message(true); // You win!
      }
    }

    self.updateSuggestion(metadata.suggestion);
  });
};

// Continues the game (both restart and keep playing)
HTMLActuator.prototype.continueGame = function continueGame() {
  this.clearMessage();
};

HTMLActuator.prototype.clearContainer = function clearContainer(container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
};

HTMLActuator.prototype.addTile = function addTile(tile) {
  const self = this;

  const wrapper = document.createElement('div');
  const inner = document.createElement('div');
  const position = tile.previousPosition || { x: tile.x, y: tile.y };
  const positionClass = this.positionClass(position);

  // We can't use classlist because it somehow glitches when replacing classes
  const classes = ['tile', `tile-${tile.value}`, positionClass];

  if (tile.value > 2048) classes.push('tile-super');

  this.applyClasses(wrapper, classes);

  inner.classList.add('tile-inner');
  inner.textContent = tile.value;

  if (tile.previousPosition) {
    // Make sure that the tile gets rendered in the previous position first
    window.requestAnimationFrame(() => {
      classes[2] = self.positionClass({ x: tile.x, y: tile.y });
      self.applyClasses(wrapper, classes); // Update the position
    });
  } else if (tile.mergedFrom) {
    classes.push('tile-merged');
    this.applyClasses(wrapper, classes);

    // Render the tiles that merged
    tile.mergedFrom.forEach((merged) => {
      self.addTile(merged);
    });
  } else {
    classes.push('tile-new');
    this.applyClasses(wrapper, classes);
  }

  // Add the inner part of the tile to the wrapper
  wrapper.appendChild(inner);

  // Put the tile on the board
  this.tileContainer.appendChild(wrapper);
};

HTMLActuator.prototype.applyClasses = function applyClasses(element, classes) {
  element.setAttribute('class', classes.join(' '));
};

HTMLActuator.prototype.normalizePosition = function normalizePosition(position) {
  return { x: position.x + 1, y: position.y + 1 };
};

HTMLActuator.prototype.positionClass = function positionClass(positionInput) {
  const position = this.normalizePosition(positionInput);
  return `tile-position-${position.x}-${position.y}`;
};

HTMLActuator.prototype.updateScore = function updateScore(score) {
  this.clearContainer(this.scoreContainer);

  const difference = score - this.score;
  this.score = score;

  this.scoreContainer.textContent = this.score;

  if (difference > 0) {
    const addition = document.createElement('div');
    addition.classList.add('score-addition');
    addition.textContent = `+${difference}`;

    this.scoreContainer.appendChild(addition);
  }
};

HTMLActuator.prototype.updateBestScore = function updateBestScore(bestScore) {
  this.bestContainer.textContent = bestScore;
};

HTMLActuator.prototype.message = function message(won) {
  const type = won ? 'game-won' : 'game-over';
  const msg = won ? 'You win!' : 'Game over!';

  this.messageContainer.classList.add(type);
  this.messageContainer.getElementsByTagName('p')[0].textContent = msg;
};

HTMLActuator.prototype.clearMessage = function clearMessage() {
  // IE only takes one value to remove at a time.
  this.messageContainer.classList.remove('game-won');
  this.messageContainer.classList.remove('game-over');
};

HTMLActuator.prototype.updateSuggestion = function updateSuggestion(suggestion) {
  this.suggestionContainer.textContent = suggestion;
};

module.exports = HTMLActuator;
