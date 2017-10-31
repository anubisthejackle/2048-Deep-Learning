const ace = require('brace');
require('brace/theme/cobalt');
require('brace/theme/solarized_dark');
require('brace/mode/javascript');

require('./style/main.scss');

const Container = require('./html/container.html');

const editorGetSuggestion = require('./editorGetSuggestion.js');
const GameManager = require('./game_manager.js');
const KeyboardInputManager = require('./keyboard_input_manager.js');
const LocalStorageManager = require('./local_storage_manager.js');
const HTMLActuator = require('./html_actuator.js');
const MoveStore = require('./MoveStore.js');

const [gameSeed = '', moves = ''] = window.location.hash.slice(1).split(',');

window.Board = require('./Board.js');

// Wait till the browser is ready to render the game (avoids glitches)
window.requestAnimationFrame(() => {
  document.body.appendChild(Container());

  const editor = ace.edit('editor');
  editor.getSession().setMode('ace/mode/javascript');
  editor.setTheme('ace/theme/solarized_dark');

  editor.setOptions({
    tabSize: 2,
    softTab: true,
    printMargin: false,
    displayIndentGuides: true,
  });

  window.gameManager = new GameManager({
    size: 4,
    gameSeed,
    moveStore: MoveStore(moves),
    InputManager: KeyboardInputManager,
    Actuator: HTMLActuator,
    StorageManager: LocalStorageManager,
    getSuggestion: editorGetSuggestion(editor),
  });
});
