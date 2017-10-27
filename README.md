# 2048 AI
Based on 2048 by Gabriele Cirulli -- https://github.com/gabrielecirulli/2048

This AI uses a Deep Learning Artificial Neural Network with reinforcement learning for training to teach itself how to play 2048. At the outset it only knows that there are four possible choices, to swipe up, down, left and right. It learns that it likes to get high scores per swipe. It also likes to have empty squares on the board, and it likes to have high numbers on the board. It also enjoys having a long game time.

I have not currently been able to achieve a 2048 with this AI, but that will come with a proper neural network design, which I am constantly updating.

## Headless 2048

I've started working on a Headless clone of 2048, and would love any help you want to provide.
http://github.com/anubisthejackle/Headless-2048/

It is designed to run under Node.js and should be as separated as possible to make it work completely on it's own, without being directly tied to any input device or the like. Once that is achieved, I will be reworking the Deep Learning AI to run via Node as well, and use the Headless 2048 to do it's training.

More to come!
