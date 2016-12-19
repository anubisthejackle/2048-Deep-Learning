function AI() {

	this.moves = [0,1,2,3];
	this.brain = new deepqlearn.Brain(19,4, {
		epsilon_test_time: 0.0,
		epsilon_min: 0.01,
		experience_size: 3000000,
		temporal_window: 100,
		start_learn_threshold: 1,
		gama: 0.9
	});
	this.previousMove = 0;	
	this.previousMoved = false;
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
	}
	
	document.getElementById('max-value').innerHTML = 'Session-wide Max tile Value is: ' + StateManager.maxVal + '<br />Current Game Max tile Value is: ' + max;
	
	return max;

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

	var inputs = [];

	var max = this.getMaxVal();

	this.grid.cells.forEach(function(row, index) {
		row.forEach( function( curVal ) {
			
			if( curVal ){
				inputs.push( curVal.value / 2048 );
			}else{
				inputs.push(0);
			}
		});
	});

	inputs.push( ( this.previousMove > 0 ) ? this.previousMove / 4      : 0 );
	inputs.push( ( score > 0 )             ? ( 1 + ( -1 / score ) )     : 0 );
	inputs.push( ( moved )                 ? 1                          : 0 );
	inputs.push( ( this.getEmptyCount() > 0 ) ? this.getEmptyCount()    : 0 );

//	console.log('Inputs: ', inputs);
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

AI.prototype.reward = function(meta) {

	var max = this.getMaxVal();	
	if( meta.over && meta.won ){

		reward = 1;

	}else if( meta.score != meta.previous ) {
		reward = (max > 0) ? max / 2048 : 0;
		//reward  = ( 1 + (-1 / ( meta.score - meta.previous ) ) );
	//	reward += ( ( meta.empty > 0 ) ? ( meta.empty / 16 ) : 0 );
	//	reward /= 4;

	}else{

		reward = -(0.5);
		//reward = 0;
	}

	//if( meta.over && !meta.won ){
//		console.log('Inverting Reward due to Loss');
	//	reward *= -1;
	//}
	console.log('Reward: ', reward );
	this.brain.backward( reward );
//	if( (Math.floor( Math.random() * (100 - 2) ) + 1) > 50 ){
		this.brain.visSelf(document.getElementById('brainInfo'));
//	}

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
