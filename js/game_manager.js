var StateManager = {
	previousMove: false,
	maxVal: 0,
	scores: [],
	lowestScore: false,
	medianScore: false,
	meanScore: false,
	highestScore: false
};

function getMedian(values) {

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
        try{
  		console.log('Initiate brain load');
  	//	this.ai.brain = JSONfn.parse( document.getElementById('savestate').value );
  	}catch(err){ /* Do nothing */ console.log('Brain failed to load'); }
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

  if( typeof this.ai == "undefined"){
  	this.ai = new AI();
  }else{
  	this.ai = this.ai;
  }
  
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
		StateManager.medianScore = getMedian(StateManager.scores);
		for( score in StateManager.scores ){

			sum += StateManager.scores[ score ];

		}
		console.log( sum );
		StateManager.meanScore = sum / StateManager.scores.length;

	}
	
	document.getElementById('highest-score').innerHTML='Highest Score: ' + StateManager.highestScore;
	document.getElementById('lowest-score').innerHTML='Lowest Score: ' + StateManager.lowestScore;
	document.getElementById('median-score').innerHTML='Median Score: ' + StateManager.medianScore;
	document.getElementById('average-score').innerHTML='Mean Score: ' + StateManager.meanScore;

	// the entire object is now simply string. You can save this somewhere
	//var str = JSONfn.stringify(this.ai.brain);
	//document.getElementById('savestate').value=str;
	
	if( !this.win ){
		setTimeout( function() {

			GM.actuator.restart();
			GM.setup();
			document.getElementById("run-button").click();
			document.getElementById("run-button").click();

		}, 2000 );
	}

};

// makes a given move and updates state
GameManager.prototype.move = function(direction) {
  var result = this.grid.move(direction);
  this.score += result.score;
	this.ai.setMoved(result.moved);
  if (!result.won) {
    if (result.moved) {
      this.grid.computerMove();
    }
  } else {
    this.won = true;
  }

  //console.log(this.grid.valueSum());

  if (!this.grid.movesAvailable()) {
	//this.history.push({ ending: this.score, moves: (this.timesMoved+1)});
	//jQuery('#scoreHistory').html('<pre>' + JSON.stringify(this.history, null, 2) + '</pre>');
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
