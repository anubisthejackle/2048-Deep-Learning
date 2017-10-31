window.fakeStorage = {
  _data: {},

  setItem(id, val) {
    return this._data[id] = String(val);
  },

  getItem(id) {
    return this._data.hasOwnProperty(id) ? this._data[id] : undefined;
  },

  removeItem(id) {
    return delete this._data[id];
  },

  clear() {
    return this._data = {};
  },
};

function LocalStorageManager() {
  this.bestScoreKey = 'bestScore';
  this.gameStateKey = 'gameState';

  const supported = this.localStorageSupported();
  this.storage = supported ? window.localStorage : window.fakeStorage;
}

LocalStorageManager.prototype.localStorageSupported = function localStorageSupported() {
  const testKey = 'test';
  const storage = window.localStorage;

  try {
    storage.setItem(testKey, '1');
    storage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
};

// Best score getters/setters
LocalStorageManager.prototype.getBestScore = function getBestScore() {
  return this.storage.getItem(this.bestScoreKey) || 0;
};

LocalStorageManager.prototype.setBestScore = function setBestScore(score) {
  this.storage.setItem(this.bestScoreKey, score);
};

// Game state getters/setters and clearing
LocalStorageManager.prototype.getGameState = function getGameState() {
  const stateJSON = this.storage.getItem(this.gameStateKey);
  return stateJSON ? JSON.parse(stateJSON) : null;
};

LocalStorageManager.prototype.setGameState = function setGameState(gameState) {
  this.storage.setItem(this.gameStateKey, JSON.stringify(gameState));
};

LocalStorageManager.prototype.clearGameState = function clearGameState() {
  this.storage.removeItem(this.gameStateKey);
};

module.exports = LocalStorageManager;
