function AI() {
	
	this.moves = [0,1,2,3];
	this.brain = new deepqlearn.Brain(19,4, {
		epsilon_test_time: 0.05,
		epsilon_min: 0.001,
		experience_size: 30000,
		temporal_window: 1000,
		start_learn_threshold: 1,
		learnings_steps_burnin: 30000,
		gama: 0.7,
		tdtrainer_options: {method: 'adadelta', learning_rate:0.01, momentum:0.9, batch_size:1}
	});
	this.previousMove = 0;	
	this.previousMoved = false;
	this.moved = false;
	this.previousEmpty = 0;
	this.previousMax = 0;
}

AI.prototype.toggleLearning = function() {

	if( this.brain.learning ) {
		console.log( 'Learning turned off' );
		this.brain.epsilon_test_time = 0.0; // don't make any random choices, ever
		this.brain.learning = false;
		return;
	}
	
	console.log('Learning turned on');
	this.brain.epsilon_test_time = 0.05; // don't make any random choices, ever
	this.brain.learning = true;
	
}

AI.prototype.getMaxVal = function() {
	var max = 0;
	this.grid.cells.forEach(function(row){
		row.forEach( function( curVal ){
			if( curVal && curVal.value > max )
				max = curVal.value;
		});
	});

	if( StateManager.maxVal < max ){
		StateManager.maxVal = max;
		this.doReward();
	}
	
	if( StateManager.gameMaxVal < max ) {
		StateManager.gameMaxVal = max;
		this.doReward();	
	}
	
	document.getElementById('max-value').innerHTML = 'Session-wide Max tile Value is: ' + StateManager.maxVal + '<br />Current Game Max tile Value is: ' + max;
	
	return max;

}

AI.prototype.getAverageVal = function( normalize ) {
	
	var sum = 0;
	this.grid.cells.forEach(function(row){
		row.forEach( function( curVal ){
			if( curVal ) {
				sum += curVal.value;
			}
		});
	});
	
	average = sum / 16;
	
	if( normalize ) {
		average = average / 2048;	
	}
	
	return average;
	
}

AI.prototype.getEmptyCount = function() {

	var count = 0;
	this.grid.cells.forEach(function(row) {
		row.forEach( function( curVal ) {
			if( curVal )
				return;
			
			count++;
		});
	});

	return count;

}

AI.prototype.buildInputs = function(score, moved, timesMoved, pMove) {

	console.log( 'Times Moved: ', timesMoved );
	
	var inputs = [];

	var max = this.getMaxVal();

	this.grid.cells.forEach(function(row, index) {
		row.forEach( function( curVal ) {
			
			if( curVal ){
				inputs.push( curVal.value / max );
			}else{
				inputs.push(0);
			}
		});
	});
	this.moved = moved;
	inputs.push( ( moved )                 ? 1                          : 0 );
	inputs.push( ( this.previousMove > 0 ) ? this.previousMove / 4      : 0 );
	inputs.push( timesMoved );
	/*inputs.push( ( score > 0 )             ? ( 1 + ( -1 / score ) )     : 0 );
	inputs.push( ( moved )                 ? 1                          : 0 );
	inputs.push( ( this.getEmptyCount() > 0 ) ? this.getEmptyCount()    : 0 );*/

	return inputs;

}

AI.prototype.getBest = function(grid, meta) {
	this.grid = grid;
	var inputs = this.buildInputs( meta.score, meta.moved );
	var action = this.brain.forward( inputs );
	
	var move = {
		move: this.moves[action]
	};

	this.previousMove = move.move;
	
	return move;

}

AI.prototype.setMoved = function(moved){
	this.previousMoved = moved;
}

AI.prototype.setOver = function( over ) {
	this.over = over;	
}

AI.prototype.doReward = function() {
	
	this.brain.backward( ( this.getMaxVal() / 2048 ) );
	this.brain.backward( this.getAverageVal( true ) );
	this.brain.visSelf( document.getElementById('brainInfo') );
			   
}

AI.prototype.reward = function(meta) {
	var reward = 0;

	console.log( meta );
	
	if( !this.over ) {
		// If we are not done the game, we do not reward yet.
		return;
	}
	

	
	/**
	 * We provide a reward that is relative between 0 and 1 based on how closely
	 * the largest tile is to 2048.
	 */
	this.brain.backward( ( this.getMaxVal() / 2048 ) );
	this.brain.visSelf(document.getElementById('brainInfo'));
	this.over = false;
	return;
	
	/**
	  IGNORE ALL BEYOND THIS POINT
	  **/
	if( this.over && !this.won ){
		this.brain.backward( -1 );
		console.log('Failure Reward:', -1);
		return;
	}
	empty = this.getEmptyCount();
	/*
	if( this.previousEmpty > 0 && this.previousEmpty > empty ){
		reward = ((16 - empty) * -1)/16; // Negative reward based on number of filled squares
		console.log('Empty Reward (Neg):', (((16 - empty) * -1)/16));
	}else if( this.previousEmpty > 0 && this.previousEmpty <= empty ){
		reward = empty / 16; // Positive reward based on number of empty squares
		console.log('Empty Reward (Pos):', (empty/16));
	}
        */
	this.previousEmpty = empty;
	
	//reward += this.getMaxVal() / 2048;
	
	if( this.getMaxVal() <= this.previousMax ) {
		this.previousMax = this.getMaxVal();
		return;	
	}
	
	reward += 1;
	console.log('Max Value Change Reward: ', 1);
	
	this.previousMax = this.getMaxVal();
	
	if( this.moved == false ){
	//	reward = reward * -1;
		return;
	}

	//reward += (meta.score - meta.previous) / 2048;
	
	//console.log( 'Score Reward: ', ((meta.score - meta.previous) / 2048) );
	
	this.brain.backward( reward );
	this.brain.visSelf(document.getElementById('brainInfo'));
	
	console.log( "Reward: ", reward );

}

AI.prototype.rewardMultiple = function(meta){

	var max = this.getMaxVal();
	var scoreReward = ( 1 + (-1 / (meta.score - meta.previous ) ) );
	var maxReward = ( 1 + ( ( -1 * max ) / meta.score ) );
	var movesReward = ( ( meta.timesMoved > 0 ) ? ( 1 + (-1 / meta.timesMoved ) ) : 0);
	var emptyReward = ( ( meta.empty > 0 ) ? ( 1 + (-1 / meta.empty ) ) : 0 );

	this.brain.backward( scoreReward );
	this.brain.backward( maxReward );
	this.brain.backward( movesReward );
	this.brain.backward( emptyReward );
//	if( (Math.floor( Math.random() * (100 - 2) ) + 1) > 90 ){
		this.brain.visSelf(document.getElementById('brainInfo'));
//	}

}

AI.prototype.savenet = function() {
      var j = this.brain.value_net.toJSON();
      var t = JSON.stringify(j);
      document.getElementById('savestate').value = t;
}
    
AI.prototype.loadnet = function() {
      var t = document.getElementById('savestate').value;
      var j = JSON.parse(t);
      this.brain.value_net.fromJSON(j);
}
