var StateManager = {
	previousMove: false,
	maxVal: 0,
	gameMaxVal: 0,
	scores: [],
	max: [],
	maxlearning: [],
	lowestScore: false,
	medianScore: false,
	meanScore: false,
	highestScore: false,
	gamesPlayed: false,
};

var chart = $("#chart");
var plot = $.plot(chart, [[0, 1]], {
	series: {
		shadowSize: 0,	// Drawing is faster without shadows
		//color: "rgb(246, 94, 59)",
	},
	xaxis: {
		show: true
	},
	yaxis: {
		tickDecimals: 0
	},
	legend: { position: "nw" }
});

chart.append("<div style='position:absolute;top:12px;right:13px' id='highest-score'></div>");
chart.append("<div style='position:absolute;top:30px;right:13px' id='median-score'></div>");
chart.append("<div style='position:absolute;top:50px;right:13px' id='average-score'></div>");
chart.append("<div style='position:absolute;top:68px;right:13px' id='lowest-score'></div>");
chart.append("<div style='position:absolute;top:155px;right:13px' id='games-played'></div>");

function getChartDataset(a,maxval) {
	var data = [];
	var max = maxval;
	if (max > a.length){  // If length of results is less than max, let it populate the chart.
		for (var i = 0; i < a.length; i++) {
			data.push([i, a[i]]);
		}
	}else if (max <= a.length){  // if the chart has more values than max, trim extra from the start.
		for (var i = (a.length - max); i < a.length; i++) {
			data.push([i, a[i]]);
		}
	}
	return data;
}

function updateChart() {
	var dataset = [
		{
		    data: getChartDataset( StateManager.max, 50 ),
		    label: "Attempts"
		},
	    	{
		    data: getChartDataset( StateManager.maxlearning, 50 ),
		    label: "Learning"
		}
	];

	plot.setData( dataset ); //I thing 50 is enough.
	plot.setupGrid();
	plot.draw();
}

function getMedian(values) {
	var val = values.slice(); // clone array to not sort original
	val.sort( function(a,b) {return a - b;} );
    var half = Math.floor(val.length/2);

    if(val.length % 2)
        return val[half];
    else
        return (val[half-1] + val[half]) / 2.0;
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
  		//console.log('Initiate brain load');
  	//	this.ai.brain = JSONfn.parse( document.getElementById('savestate').value );
  	}catch(err){ /* Do nothing */ console.log('Brain failed to load'); }
    }
  }.bind(this));

  this.inputManager.on('savenet', function() {
	  this.ai.savenet();
  }.bind(this));

  this.inputManager.on('loadnet', function() {
	  this.ai.loadnet();
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
  this.previousScore = 0;
  this.previousMove = false;
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
	
	if( this.ai.brain.learning ) {
		StateManager.maxlearning.push( this.ai.getMaxVal() );
	}else{
		StateManager.max.push( this.ai.getMaxVal() );
	}

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
		StateManager.gamesPlayed = StateManager.scores.length;

	}

	updateChart();
	
	// ~~val double bitwise NOT to convert to int
	document.getElementById('highest-score').innerHTML='Highest Score: ' + ~~StateManager.highestScore;
	document.getElementById('lowest-score').innerHTML='Lowest Score: ' + ~~StateManager.lowestScore;
	document.getElementById('median-score').innerHTML='Median Score: ' + ~~StateManager.medianScore;
	document.getElementById('average-score').innerHTML='Mean Score: ' + ~~StateManager.meanScore;
	document.getElementById('games-played').innerHTML='Games Played: ' + ~~StateManager.gamesPlayed;

	// the entire object is now simply string. You can save this somewhere
	//var str = JSONfn.stringify(this.ai.brain);
	//document.getElementById('savestate').value=str;
	
	if( !this.win ){
		if( this.ai ) {
			console.log('Toggle learning?');
			this.ai.toggleLearning();	
		}
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
	this.ai.doReward( result.won );
	StateManager.gameMaxVal = 0;
	this.over = true;
  }

  this.actuate();

	return result;
}

// moves continuously until game is over
GameManager.prototype.run = function() {
	var best = this.ai.getBest(this.grid, {
		score: this.score,
		moved: ( ( StateManager.previousMove ) ? StateManager.previousMove.moved : false ),
		timesMoved: this.timesMoved,
		pMove: StateManager.previousMove
	});
	/*this.ai.reward({
			score: this.score,
			previous: this.previousScore,
			won: this.won,
			over: this.over,
			timesMoved: this.timesMoved,
			empty: this.ai.getEmptyCount()
		});*/
	this.previousScore = this.score;
	StateManager.previousMove = this.move(best.move);
	this.timesMoved++;
	
  var timeout = animationDelay;
  if (this.running && !this.over && !this.won) {
    var self = this;
    setTimeout(function(){
      self.run();
    }, timeout);
  }
}
