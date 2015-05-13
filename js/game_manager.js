var StateManager = {
	previousMove: false,
	maxVal: 0,
	scores: [],
	lowestScore: false,
	medianScore: false,
	meanScore: false,
	highestScore: false
};

function median(values) {

    values.sort( function(a,b) {return a - b;} );

    var half = Math.floor(values.length/2);

    if(values.length % 2)
        return values[half];
    else
        return (values[half-1] + values[half]) / 2.0;

}

function GameManager(size, InputManager, Actuator) {
  this.size         = size; // Size of the grid
  this.inputManager = new InputManager;
  this.actuator     = new Actuator;

  this.running      = false;

  this.inputManager.on("move", this.move.bind(this));
  this.inputManager.on("restart", this.restart.bind(this));

  this.inputManager.on('think', function() {
    var best = this.ai.getBest({
		score: this.score
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

  this.ai           = this.ai || new AI(this.grid);

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
/*var StateManager = {
	previousMove: false,
	maxVal: 0,
	scores: [],
	lowestScore: false,
	medianScore: false,
	meanScore: false,
	highestScore: false
};*/

	StateManager.scores.push( this.score );

	if( StateManager.lowestScore === false || StateManager.lowestScore > this.score )
		StateManager.lowestScore = this.score;

	if( StateManager.highestScore === false || StateManager.highestScore < this.score )
		StateManager.highestScore = this.score;

	if( StateManager.scores.length == 1 ){
		StateManager.medianScore = this.score;
		StateManager.meanScore = this.score;
	}else{
	
		var sum = 0;
		var median = median(StateManager.scores);
		for( score in StateManager.scores ){

			sum += score;

		}

		StateManager.meanScore = sum / StateManager.scores.length;

	}
	
	document.getElementById('highest-score').innerHTML='Highest Score: ' + StateManager.highestScore;
	document.getElementById('lowest-score').innerHTML='Lowest Score: ' + StateManager.lowestScore;
	document.getElementById('median-score').innerHTML='Median Score: ' + StateManager.medianScore;
	document.getElementById('average-score').innerHTML='Mean Score: ' + StateManager.meanScore;
	
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

  if (!result.won) {
    if (result.moved) {
      this.grid.computerMove();
    }
  } else {
    this.won = true;
  }

  //console.log(this.grid.valueSum());

  if (!this.grid.movesAvailable()) {
    this.over = true; // Game over!
  }

  this.actuate();

	return result;
}

// moves continuously until game is over
GameManager.prototype.run = function() {
	var best = this.ai.getBest(this.grid, {
		score: this.score,
		moved: ( ( StateManager.previousMove ) ? StateManager.previousMove.moved : false ),
		timesMoved: this.timesMoved
	});
	this.previousScore = this.score;
	StateManager.previousMove = this.move(best.move);
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
