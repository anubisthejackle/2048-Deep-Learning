function AI() {
	this.moves = [0,1,2,3];
    this.brain = this.newBrain();

    this.previousGrid = null;
	this.previousMove = 0;
    this.previousMax = 0;
	this.previousMoved = false;
    
    this.grid = null;
    this.maxValue = 0;

    document.addEventListener( 'toggle-learning', function() {
        this.brain.toggle_learning();
    }.bind(this));
}

AI.prototype.newBrain = function(opts) {
    var inputs = 16+16+1;
    var actions = 4;
    var temporal_window = 10;
    var network_size = inputs * temporal_window + actions * temporal_window + inputs;

    var options = {
        epsilon_max: .75,
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
                type: 'conv',
                sx: 5,
                filters: 8,
                stride: 1,
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
        ],
        ...opts // Allow overriding of default options.
    };

    return new deepqlearn.Brain(
        inputs, 
        actions, 
        options
    );
}
    
AI.prototype.load = function(json) {
    this.brain = this.newBrain({
        epsilon_max: 0.5 // On brain load we don't want to randomize _every_ move.
    });
        
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

    // 10-25-2023 -- When score changes, give a boost based on the number of empty spaces.

    if ( meta.score > meta.previous ) {
        var empty = this.getEmptyCount();

        // There are 16 squares, so at most this could ever be 16 empty spaces, minus 1 for the highest square.
        if ( empty > 0 ) {
            var valueReward = this.getEmptyCount() / 15;

            this.brain.backward( valueReward );
        }
    }

    // Slap them for trying an impossible move.
    if ( this.previousGrid && JSON.stringify(this.previousGrid.cells) === JSON.stringify(this.grid.cells) ) {
        this.brain.backward(-1);
    }
    
    // Major reward for winning.
    // if ( meta.won ) {
    //     this.brain.backward(1);
    // } else if ( meta.over && ! meta.won ) {
    //     this.brain.backward( roundToFourDecimal( -1 * (2048 - this.maxValue) / (2048 - 2) ) );
    // } else if ( this.maxValue > this.previousMax ) {
    //     var valueReward = (this.maxValue - 2) / (2048 - 2);
    //     this.brain.backward( roundToFourDecimal( valueReward ) );
    // } else if ( meta.score > meta.previous ) {
        /*
         * The hope of adding this reward is that, as a last ditch effort,
         * the AI will _at least_ attempt to find moves that merge blocks.
         * While prioritizing moves that bump the max value, and win the game.
         */
        // this.brain.backward( 0.00045 ); // Reward for half the value of bumping the max value to 4.
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
