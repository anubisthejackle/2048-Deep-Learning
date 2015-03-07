window.previousMove = {moved: false, move: 0};
function GameManager(size, InputManager, Actuator) {
  this.size         = size; // Size of the grid
  this.inputManager = new InputManager;
  this.actuator     = new Actuator;
  this.running      = false;
	this.history = [];
  this.inputManager.on("move", this.move.bind(this));
  this.inputManager.on("restart", this.restart.bind(this));

  this.inputManager.on('think', function() {
    var best = this.ai.getBest({
		score: this.score,
		grid: this.grid
	});
    this.actuator.showHint(best.move);
  }.bind(this));


  this.inputManager.on('run', function() {
    if (this.running) {
      this.running = false;
      this.actuator.setRunButton('Auto-run');
    } else {
      this.running = true;
      this.run()
      this.actuator.setRunButton('Stop');
    }
  }.bind(this));

  this.setup();
}

// Restart the game
GameManager.prototype.restart = function () {
  this.actuator.restart();
 // this.running = false;
 // this.actuator.setRunButton('Auto-run');
  this.setup();
};

// Set up the game
GameManager.prototype.setup = function () {
  this.grid         = new Grid(this.size);
  this.grid.addStartTiles();

  this.ai           = this.ai || new AI();

  this.score        = 0;
  this.over         = false;
  this.won          = false;
  this.timesMoved   = 0;
  // Update the actuator
  this.actuate();
};


// Sends the updated grid to the actuator
GameManager.prototype.actuate = function () {

	this.actuator.actuate(this.grid, {
		score: this.score,
		over:  this.over,
		won:   this.won
	});

	if(this.over){
		this.logResults();
	}

};

GameManager.prototype.logResults = function() {
	var GM = this;
	
	if( !this.win ){
		setTimeout( function() {

			GM.actuator.restart();
			GM.setup();
			document.getElementsByClassName("ai-button")[1].click();
			document.getElementsByClassName("ai-button")[1].click();

		}, 2000 );
	}

};

// makes a given move and updates state
GameManager.prototype.move = function(direction) {
  var result = this.grid.move(direction);
  this.score += result.score;
	if( window.previousMove ){
		console.log('window.previousMove.moved');
		window.previousMove.moved = result.moved;
	}else{
		console.log('overwrite window.previousMove');
		window.previousMove = { moved: ((result.moved) ? true : false), move: 0 };
	}
  if (!result.won) {
    if (result.moved) {
      this.grid.computerMove();
    }
  } else {
    this.won = true;
  }

  //console.log(this.grid.valueSum());

  if (!this.grid.movesAvailable()) {
	this.history.push({ ending: this.score, moves: (this.timesMoved+1)});
	jQuery('#scoreHistory').html('<pre>' + JSON.stringify(this.history, null, 2) + '</pre>');
    this.over = true; // Game over!
  }

  this.actuate();
}

// moves continuously until game is over
GameManager.prototype.run = function() {
	console.log('Previous Move at Start of Run: ', window.previousMove);
	var best = this.ai.getBest({
		score: this.score,
		moved: ( ( window.previousMove ) ? window.previousMove.moved : false ),
		previousMove: ( ( window.previousMove ) ? window.previousMove.move : 0 ),
		timesMoved: this.timesMoved,
		grid: this.grid
	});
	this.previousScore = this.score;
	this.move(best.move);
	console.log('Previous Move After Move: ', window.previousMove);
	window.previousMove = best;
	this.timesMoved++;
	this.ai.reward({
			score: this.score,
			previous: this.previousScore,
			won: this.won,
			over: this.over,
			timesMoved: this.timesMoved,
			empty: this.ai.getEmptyCount()
		});
  var timeout = animationDelay;
  if (this.running && !this.over && !this.won) {
    var self = this;
    setTimeout(function(){
      self.run();
    }, timeout);
  }
}
