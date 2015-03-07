function AI() {

	this.moves = [0,1,2,3];
	this.brain = new deepqlearn.Brain(19,4, {
		epsilon_test_time: 0.0 // Shut off random guess
	});
	this.previousMove = 0;

}

AI.prototype.getMaxVal = function() {
	var max = 0;
	this.grid.cells.forEach(function(row){
		row.forEach( function( curVal ){
			if( curVal && curVal.value > max )
				max = curVal.value;
		});
	});
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

AI.prototype.buildInputs = function(score, moved, timesMoved, previousMove) {

	var inputs = [];

	var max = this.getMaxVal();

	this.grid.cells.forEach(function(row, index) {
		row.forEach( function( curVal ) {
			
			if( curVal ){
				inputs.push( ( 1 + ( -1 / curVal.value ) ) );
			}else{
				inputs.push(0);
			}
		});
	});

	inputs.push( ( previousMove > 0 ) ? previousMove / 4      : 0 );
	inputs.push( ( score > 0 )             ? ( 1 + ( -1 / score ) )     : 0 );
	inputs.push( ( moved )                 ? 1                          : 0 );
	inputs.push( ( timesMoved > 0 )        ? ( 1 + (-1 / timesMoved ) ) : 0 );

	console.log('Inputs: ', inputs);
	return inputs;

}

AI.prototype.getBest = function(meta) {

	this.grid = meta.grid;
	var inputs = this.buildInputs( meta.score, meta.moved, meta.timesMoved, meta.previousMove );
	var action = this.brain.forward( inputs );
	
	return {
		move: this.moves[action]
	};

}

AI.prototype.reward = function(meta) {

	var max = this.getMaxVal();	
	if( meta.over && meta.won ){

		reward = 1;

	}else if( meta.score != meta.previous ) {

		reward  = ( 1 + (-0.1 / ( meta.score - meta.previous ) ) );
		console.log('Score Reward: ', reward);
		maxReward = ( 1 + ( (-0.1 * max) / meta.score ) );
		console.log('Max Reward: ', maxReward);
		moveReward = ( ( meta.timesMoved > 0 ) ? ( 1 + (-0.1 / meta.timesMoved ) ) : 0 );
		console.log('Move Reward: ', moveReward);
		emptyReward = ( ( meta.empty > 0 ) ? -0.1 / meta.empty : 0 );
		console.log('Empty Reward: ', emptyReward);
		reward = ( reward + maxReward + moveReward + emptyReward ) / 4;

	}else{

		reward = -(0.5);

	}

	if( meta.over && !meta.won )
		reward *= -1;

	console.log('Reward: ', reward );
	this.brain.backward( reward );
	this.brain.visSelf(document.getElementById('brainInfo'));

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
	this.brain.visSelf(document.getElementById('brainInfo'));

}
