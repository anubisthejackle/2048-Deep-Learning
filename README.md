# 2048 AI

## UPDATES TO CORE
### To Come

I'm going to keep the original layout and stylesheet, and that's about it. I'll do the logic in a Node server, and use EventSource to push the events to the front end.

OR

I'll do the training in the Node server, and duplicate the game board logic for the front end, so I can watch the game play, passing the neural network VIA EventSource.

## UPDATES TO AI
### To Come

I'm going to build out a Neural Network behind this. It will be untrained, and will completely self-train.

INPUTS:

	- One input for each spot on the board (16 in total) going from left to right, and top to bottom.
		~ Allows the network to "see" the board
		~ Normalized based on the maximum value on the board.
		~ ( Spot Value / Maximum Value )
		~ If spot is empty, normalize to 0
		~ ALTERNATIVELY:
		~ ( 1 + ( -1 / Spot Value ) )
		~ This would give us an ever increasing value for the maximum value, but in some longer games of infinite play, could diminish to making all squares appear the same.

	- One input for the previously attempted move: 
		~ (1/4) for up
		~ (2/4) for down
		~ (3/4) for left
		~ (4/4) for right
		~ 0 for no move
	
	- One input for success or failure of the previous move
		~ 1 for Success
		~ 0 for Failure

	- One input for current score, normalized like this: ( 1 + ( -1 / score ) )
		~ Maintains an increased response as the score increases, which will help to entice the network to keep trying for more points.

If we use ConvNet:

Q-Learner API

It's very simple to use deeqlearn.Brain: Initialize your network:

   var brain = new deepqlearn.Brain(num_inputs, num_actions);
   
And to train it proceed in loops as follows:

   var action = brain.forward(array_with_num_inputs_numbers);
   // action is a number in [0, num_actions) telling index of the action the agent chooses
   // here, apply the action on environment and observe some reward. Finally, communicate it:
   brain.backward(reward); // <-- learning magic happens here
   
That's it! Let the agent learn over time (it will take opt.learning_steps_total), and it will only get better and better at accumulating reward as it learns. Note that the agent will still take random actions with probability opt.epsilon_min even once it's fully trained. To completely disable this randomness, or change it, you can disable the learning and set epsilon_test_time to 0:

   brain.epsilon_test_time = 0.0; // don't make any random choices, ever
   brain.learning = false;
   var action = brain.forward(array_with_num_inputs_numbers); // get optimal action from learned policy
   

For us that would mean:

	var brain = new deepqlearn.Brain(19, 4);

This sets up the network.

Then we collect the inputs in an array, and run

	var action = brain.forward(inputs);

This gives us the action we want to perform. The action will be an index of an array of actions.

Something like this:

        var actionix = this.brain.forward(input_array);
	var action = this.actions[actionix];

So if we have

	var actions = ['up','down','left','right'];

The network will eventually figure out what actions it's talking about.

Once we have the action, we'll run the action, and then *reinforce* the network.

	brain.backward(reward);

Where reward is a number normalized between 0.0 and 1.0. For our purposes this could be the move score normalized.
