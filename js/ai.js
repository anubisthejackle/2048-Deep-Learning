function AI() {

	this.moves = [0,1,2,3];
    this.brain = this.newBrain();

    this.previousGrid = null;
	this.previousMove = 0;
    this.previousMax = 0;
	this.previousMoved = false;
    
    this.grid = null;
    this.maxValue = 0;
}

AI.prototype.newBrain = function() {
    var inputs = 16+16+1;
    var actions = 4;
    var temporal_window = 1;
    var network_size = inputs * temporal_window + actions * temporal_window + inputs;

    return new deepqlearn.Brain(
        inputs, 
        actions, 
        {
            learning_steps_total: 10000,
            learning_steps_burnin: 300,
            temporal_window: temporal_window,
            layer_defs: [
                {
                    type: 'input',
                    out_depth: network_size,
                    out_sx: 1,
                    out_sy: 1
                },
                {
                    type: 'fc',
                    num_neurons: 50,
                    activation: 'relu'
                },
                {
                    type: 'fc',
                    num_neurons: 50,
                    activation: 'relu'
                },
                {
                    type: 'regression',
                    num_neurons: actions,
                }
            ]
        }
    );
}
    
AI.prototype.load = function(json) {
    this.brain = this.newBrain();
        
    this.brain.load(json);
    this.brain.visSelf(document.getElementById('brainInfo'));
}

AI.prototype.reset = function() {
    // console.log('RESETING AI GAME STATE MEMORY');
    this.previousGrid = null;
	this.previousMove = 0;
    this.previousMax = 0;
	this.previousMoved = false;
    
    this.grid = null;
    this.maxValue = 0;
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
		document.getElementById('max-value').innerHTML = 'Max tile Value is: ' + max;
	}

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

AI.prototype.buildInputs = function(score) {

	var inputs = [];

    this.previousMax = this.maxValue;
	this.maxValue = this.getMaxVal();

    if ( this.previousGrid === null ) {
        for(i=0;i<16;i++){
            inputs.push(0);
        }
    }else{
        this.previousGrid.cells.forEach(function(row, index) {
            row.forEach( function( curVal ) {
                
                if( curVal ){
                    inputs.push( curVal.value );
                }else{
                    inputs.push(0);
                }
            });
        });
    }

	this.grid.cells.forEach(function(row, index) {
		row.forEach( function( curVal ) {
			
			if( curVal ){
				inputs.push( curVal.value );
			}else{
				inputs.push(0);
			}
		});
	});

    inputs.push(score);

	return inputs;
}

AI.prototype.getBest = function(grid, meta) {
    if ( this.grid !== null ) {
        this.previousGrid = jQuery.extend(true, {}, this.grid);
    }

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

    var reward = 0;

	/*
     * The theoretical maximum delta of a score change is all 16 squares on the board going from
     * 1024 to 2048 at the same time. This would create 8 squares of 2048. The score delta would
     * then be 2048 * 8 or 16,384. This is because the score of a single move is the sum of all
     * merged square values.
     * 
     * The theoretical minimum delta score, in that case, is 4.
     * 
     * Our normalization function is (value - min) / (max - min)
     */
    // if( meta.score != meta.previous ) {
	// 	var delta = Math.max(meta.score, meta.previous) - Math.min(meta.score, meta.previous);
    //     var normalizedDelta = (delta - 4) / (16384 - 4);
    //     // console.log(`Score Reward: ${normalizedDelta}`);
    //     // reward += normalizedDelta;
    //     // this.brain.backward( roundToFourDecimal( normalizedDelta ) );
	// }

    if ( this.maxValue > this.previousMax ) {
        // var valueReward = (this.maxValue - 2) / (2048 - 2);
        // console.log(`Value Reward: ${valueReward}`);
        // reward += valueReward;
        // this.brain.backward( roundToFourDecimal( valueReward ) );
        this.brain.backward(1);
    }

    // Major reward for winning.
    if ( meta.won ) {
        // reward = reward * 2;
        this.brain.backward(1);
    }

    if ( meta.over && ! meta.won ) {
        // reward = -1 * (2048 - this.maxValue) / (2048 - 2);
        // this.brain.backward(-1 * (2048 - this.maxValue) / (2048 - 2));
        // console.log(`Game Lose Reward: ${reward}`);
        this.brain.backward(-1);
    }

    // If we have a reward, then train.
    // if ( reward != 0 ) {
        // console.log(`Total Reward: ${reward}`);
        // this.brain.backward( reward );
    // }

    this.brain.visSelf(document.getElementById('brainInfo'));
}

function roundToFourDecimal( val ) {
    return Math.round( ( val + Number.EPSILON ) * 1000 ) / 1000 
}

AI.prototype.rewardMultiple = function(meta){

// 	var max = this.getMaxVal();
// 	var scoreReward = ( 1 + (-1 / (meta.score - meta.previous ) ) );
// 	var maxReward = ( 1 + ( ( -1 * max ) / meta.score ) );
// 	var movesReward = ( ( meta.timesMoved > 0 ) ? ( 1 + (-1 / meta.timesMoved ) ) : 0);
// 	var emptyReward = ( ( meta.empty > 0 ) ? ( 1 + (-1 / meta.empty ) ) : 0 );

// 	this.brain.backward( scoreReward );
// 	this.brain.backward( maxReward );
// 	this.brain.backward( movesReward );
// 	this.brain.backward( emptyReward );
// //	if( (Math.floor( Math.random() * (100 - 2) ) + 1) > 90 ){
// 		this.brain.visSelf(document.getElementById('brainInfo'));
// //	}

}
