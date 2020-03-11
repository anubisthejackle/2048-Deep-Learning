# TODO

## Install [Liquid Carrot](https://github.com/liquidcarrot/carrot)
Liquid Carrot is an Evolutionary Neural Network framework for JavaScript. I
believe it will work here for learning how to play 2048.

## Separate the Display from the Game Play logic
Because the gameplay logic automatically updates the display, this will slow down
the actual learning process. We can speed it up, however, by separating that out.
This will allow us to play thousands of games behind the scenes without having
update the display, leading to our next topic:

## Convert New Game button to "Play Best" button
Periodically we will want to display SOMETHING, so I think converting the New Game
button to a Play Best button that will take the best Neural Network and have it
play on the displayed board will be nice.

## Implement Evolutionary network with LC
This is the hard part. Actually implementing the Liquid Carrot framework. This
will take some time to figure out, but it basically just means figuring out how
to define the type of network, what the inputs will be, and what the outputs will be.
From there it just needs to know how to evolve.