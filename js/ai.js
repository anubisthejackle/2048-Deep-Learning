function AI(grid) {

	this.grid = grid;
	this.moves = [0,1,2,3];
	this.brain = new deepqlearn.Brain(19,4);
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

AI.prototype.buildInputs = function(score, moved) {

	var inputs = [];

	var max = this.getMaxVal();

	this.grid.cells.forEach(function(row, index) {
		row.forEach( function( curVal ) {
			
			if( curVal ){
				inputs.push( parseFloat( parseFloat( curVal.value ) / max ) );
			}else{
				inputs.push(0);
			}
		});
	});

	inputs.push( ( this.previousMove > 0 ) ? this.previousMove / 4 : 0 );
	inputs.push( ( score > 0 ) ? ( 1 + ( -1 / score ) ) : 0 );
	inputs.push( ( moved ) ? 1 : 0 );

	return inputs;

}

AI.prototype.getBest = function(meta) {

	var inputs = this.buildInputs( meta.score, meta.moved );
	var action = this.brain.forward( inputs );

	return {
		move: this.moves[action]
	};

}

AI.prototype.reward = function(meta) {

	var max = this.getMaxVal();	
	if( meta.over && !meta.won ){
		
		reward = -1;

	}else if( meta.over && meta.won ){

		reward = 1;

	}else if( meta.score != meta.previous ) {

		reward = ( 1 + ( (-1 * max) / ( meta.score - meta.previous ) ) );

	}else{

		reward = 0;

	}

	console.log(reward);
	this.brain.backward( reward );
	this.brain.visSelf(document.getElementById('brainInfo'));

}
