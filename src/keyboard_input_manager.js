function KeyboardInputManager() {
  this.events = {};

  if (window.navigator.msPointerEnabled) {
    // Internet Explorer 10 style
    this.eventTouchstart = 'MSPointerDown';
    this.eventTouchmove = 'MSPointerMove';
    this.eventTouchend = 'MSPointerUp';
  } else {
    this.eventTouchstart = 'touchstart';
    this.eventTouchmove = 'touchmove';
    this.eventTouchend = 'touchend';
  }

  this.listen();
}

KeyboardInputManager.prototype.on = function on(event, callback) {
  if (!this.events[event]) {
    this.events[event] = [];
  }
  this.events[event].push(callback);
};

KeyboardInputManager.prototype.emit = function emit(event, data) {
  const callbacks = this.events[event];
  if (callbacks) {
    callbacks.forEach((callback) => {
      callback(data);
    });
  }
};

KeyboardInputManager.prototype.listen = function listen() {
  const self = this;

  const map = {
    38: 0,  // Up
    39: 1,  // Right
    40: 2,  // Down
    37: 3,  // Left
    75: 0,  // Vim up
    76: 1,  // Vim right
    74: 2,  // Vim down
    72: 3,  // Vim left
    87: 0,  // W
    68: 1,  // D
    83: 2,  // S
    65: 3,  // A
    8: 4,   // backspace
    190: 5, // dot: accept suggestion
  };

  // Respond to direction keys
  document.addEventListener('keydown', (event) => {
    if (
      document.activeElement.parentElement === document.querySelector('#editor') ||
      document.activeElement === document.querySelector('#arena-text')
    ) {
      return;
    }

    const modifiers = event.altKey || event.ctrlKey || event.metaKey ||
                    event.shiftKey;
    const mapped = map[event.which];

    if (!modifiers) {
      if (mapped !== undefined) {
        event.preventDefault();

        if (mapped <= 3) {
          self.emit('move', mapped);
        } else if (mapped === 4) {
          self.emit('undo');
        } else if (mapped === 5) {
          self.emit('acceptSuggestion');
        }
      }
    } else if (event.shiftKey) {
      if (mapped === 5) {
        self.emit('toggleRun');
      }
    }

    // R key restarts the game
    if (!modifiers && event.which === 82) {
      self.restart.call(self, event);
    }
  });

  // Respond to button presses
  this.bindButtonPress('.retry-button', this.restart);
  this.bindButtonPress('.restart-button', this.restart);
  this.bindButtonPress('.keep-playing-button', this.keepPlaying);

  // Respond to swipe events
  let touchStartClientX;
  let touchStartClientY;
  const gameContainer = document.getElementsByClassName('game-container')[0];

  gameContainer.addEventListener(this.eventTouchstart, (event) => {
    if ((!window.navigator.msPointerEnabled && event.touches.length > 1) ||
        event.targetTouches.length > 1) {
      return; // Ignore if touching with more than 1 finger
    }

    if (window.navigator.msPointerEnabled) {
      touchStartClientX = event.pageX;
      touchStartClientY = event.pageY;
    } else {
      touchStartClientX = event.touches[0].clientX;
      touchStartClientY = event.touches[0].clientY;
    }

    event.preventDefault();
  });

  gameContainer.addEventListener(this.eventTouchmove, (event) => {
    event.preventDefault();
  });

  gameContainer.addEventListener(this.eventTouchend, (event) => {
    if ((!window.navigator.msPointerEnabled && event.touches.length > 0) ||
        event.targetTouches.length > 0) {
      return; // Ignore if still touching with one or more fingers
    }

    let touchEndClientX;
    let touchEndClientY;

    if (window.navigator.msPointerEnabled) {
      touchEndClientX = event.pageX;
      touchEndClientY = event.pageY;
    } else {
      touchEndClientX = event.changedTouches[0].clientX;
      touchEndClientY = event.changedTouches[0].clientY;
    }

    const dx = touchEndClientX - touchStartClientX;
    const absDx = Math.abs(dx);

    const dy = touchEndClientY - touchStartClientY;
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) > 10) {
      if (absDx > absDy) {
        self.emit('move', dx > 0 ? 1 : 3);
      } else {
        self.emit('move', dy > 0 ? 2 : 0);
      }
    }
  });
};

KeyboardInputManager.prototype.restart = function restart(event) {
  event.preventDefault();
  this.emit('restart');
};

KeyboardInputManager.prototype.keepPlaying = function keepPlaying(event) {
  event.preventDefault();
  this.emit('keepPlaying');
};

KeyboardInputManager.prototype.bindButtonPress = function bindButtonPress(selector, fn) {
  const button = document.querySelector(selector);
  button.addEventListener('click', fn.bind(this));
  button.addEventListener(this.eventTouchend, fn.bind(this));
};

module.exports = KeyboardInputManager;
