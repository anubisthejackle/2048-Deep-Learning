<template>
    <div
        v-touch:swipe.left="swipeLeft"
        v-touch:swipe.right="swipeRight"
        v-touch:swipe.top="swipeUp"
        v-touch:swipe.bottom="swipeDown"
        class="game-container"
        >
        <GameOver :gameOver="gameOver" :gameWon="gameWon" />
        <div class="grid-container">
            <grid-row v-for="(x,index) in 4" :key="index" />
        </div>
        <div class="tile-container">
            <tile v-for="(tile,index) in tileObjs" :key="index" :tileValue="tile.value" :tileColumn="tile.column" :tileRow="tile.row" :merged="tile.merged"></tile>
        </div>
        <Keypress v-if="gameOver == false" event="keyup" @pressed="handleKeypress" />
    </div>
</template>

<style scoped>
    .game-container {
        margin-top: 40px;
        position: relative;
        padding: 15px;
        cursor: default;
        -webkit-touch-callout: none;
        -ms-touch-callout: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        -ms-touch-action: none;
        touch-action: none;
        background: #bbada0;
        border-radius: 6px;
        width: 500px;
        height: 500px;
        -webkit-box-sizing: border-box;
        -moz-box-sizing: border-box;
        box-sizing: border-box;
    }

    .grid-container {
        position: absolute;
        z-index: 1;
    }

    .tile-container {
        position: absolute;
        z-index: 2;
    }
</style>

<script>
import GridRow from './GridRow.vue';
import Tile from './Tile.vue';

export default {
    components: {
        'grid-row': GridRow,
        'tile': Tile,
        Keypress: () => import('vue-keypress'),
        GameOver: () => import('./GameOver.vue')
    },
    props:['gameNumber'],
    data() {
        return {
            tileObjs: [
            ],
            tiles: [
                    [0,0,0,0],
                    [0,0,0,0],
                    [0,0,0,0],
                    [0,0,0,0]
           ],
           gameOver: false,
           gameWon: false,
           currentScore: 0
        }
    },
    mounted() {
        this.generateRandomTile();
        this.generateRandomTile();
    },
    methods:{
        moveLeft: function(){
            // console.log("Left Arrow Pressed");
            var moved, everMoved = false;
            var tileRow;
            do{
                moved = false;
                for(var rowIndex = 0, length = this.tiles.length; rowIndex < length; rowIndex++){
                    // We are moving things from right to left, so we process from left to Right.
                    // This way we can merge easier, without needing to "look ahead"
                    tileRow = this.tiles[rowIndex];
                    for(let [colIndex, tile] of tileRow.entries()){
                        // If the tile is empty, or we're at the left edge, skip.
                        if(tile == 0 || colIndex == 0){
                            continue;
                        }

                        if(tileRow[colIndex-1] == 0){
                            // The space is empty, let's move there.
                            this.tileObjs.map(function(value) {
                                if( this.row != value.row || this.column != value.column ){
                                    // Not the tile we want
                                    return value;
                                }
                                value.column--;
                                return value;
                            }, {row: (rowIndex + 1), column: (colIndex+1)});

                            tileRow[colIndex-1] = tile;
                            tileRow[colIndex] = 0;
                            moved = true;
                            everMoved = true;
                            continue;
                        }

                        if(tileRow[colIndex-1] == tile){

                            // This is the element we are sliding
                            let collider = this.tileObjs.findIndex(function(tile){
                                return tile.row == this.row && tile.column == this.column && tile.value > 0
                            }, {row: (rowIndex+1), column: (colIndex+1)});

                            // This is the element we want to disappear
                            let collided = this.tileObjs.findIndex(function(tile){
                                return tile.row == this.row && tile.column == this.column && tile.value > 0
                            }, {row: (rowIndex+1), column: (colIndex)});

                            if( this.tileObjs[collider].merged == true || this.tileObjs[collided].merged == true ){
                                // We have already merged this tile, or the one it was supposed to merge into.
                                continue;
                            }

                            this.tileObjs[collider].column--;
                            this.tileObjs[collider].merged=true;
                            this.tileObjs[collider].value *= 2;

                            this.currentScore += this.tileObjs[collider].value;

                            this.tileObjs[collided].value = 0;

                            // Merge opportunity!
                            tileRow[colIndex-1] = tile + tile;
                            tileRow[colIndex] = 0;
                            // this.$set(this.tiles, rowIndex, tileRow);
                            moved = true;
                            everMoved = true;
                            continue;
                        }
                    }
                    this.$set(this.tiles, rowIndex, tileRow);
                }
            }while(moved == true);
            if(everMoved){
                this.generateRandomTile();
            }
        },
        moveRight: function(){
            // console.log("Right Arrow Pressed");
            var moved, everMoved = false;
            var tileRow;

            do{
                moved = false;
                for(var rowIndex = 0, length = this.tiles.length; rowIndex < length; rowIndex++){
                    // We are moving things from right to left, so we process from left to Right.
                    // This way we can merge easier, without needing to "look ahead"
                    tileRow = this.tiles[rowIndex];
                    for(var colIndex = (tileRow.length - 1); colIndex >= 0; colIndex--){
                        // If the tile is empty, or we're at the left edge, skip.
                        let tile = tileRow[colIndex];
                        if(tile == 0 || colIndex == (tileRow.length - 1)){
                            continue;
                        }

                        if(tileRow[colIndex+1] == 0){
                            // The space is empty, let's move there.

                            this.tileObjs.map(function(value) {
                                if( this.row != value.row || this.column != value.column ){
                                    // Not the tile we want
                                    return value;
                                }
                                value.column++;
                                return value;
                            }, {row: (rowIndex + 1), column: (colIndex+1)});

                            tileRow[colIndex+1] = tile;
                            tileRow[colIndex] = 0;
                            moved = true;
                            everMoved = true;
                            continue;
                        }

                        if(tileRow[colIndex+1] == tile){

                            // This is the element we are sliding
                            let collider = this.tileObjs.findIndex(function(tile){
                                return tile.row == this.row && tile.column == this.column && tile.value > 0
                            }, {row: (rowIndex+1), column: (colIndex+1)});

                            // This is the element we want to disappear
                            let collided = this.tileObjs.findIndex(function(tile){
                                return tile.row == this.row && tile.column == this.column && tile.value > 0
                            }, {row: (rowIndex+1), column: (colIndex+2)});

                            if( this.tileObjs[collider].merged == true || this.tileObjs[collided].merged == true ){
                                // We have already merged this tile, or the one it was supposed to merge into.
                                continue;
                            }

                            this.tileObjs[collider].column++;
                            this.tileObjs[collider].merged=true;
                            this.tileObjs[collider].value *= 2;
                            this.currentScore += this.tileObjs[collider].value;

                            this.tileObjs[collided].value = 0;

                            // Merge opportunity!
                            tileRow[colIndex+1] = tile + tile;
                            tileRow[colIndex] = 0;
                            moved = true;
                            everMoved = true;
                            continue;
                        }
                    }
                    this.$set(this.tiles, rowIndex, tileRow);
                }
            }while(moved == true);
            if(everMoved){
                this.generateRandomTile();
            }
        },
        moveUp: function(){
            // console.log("Up Arrow Pressed");
            var moved, everMoved = false;
            var tiles = this.tiles;

            do{
                moved = false;
                // We're going top to bottom, so we want to move the things closest
                // to the bottom first. That means begin looking at the bottom, and
                // inch our way back up.
                for(let rowIndex = 1; rowIndex < 4; rowIndex++){
                    // Now we have a row to work with, so let's iterate over the columns.
                    // The order of these doesn't matter much.
                    for(let colIndex = 0; colIndex < 4; colIndex++){

                        let tile = tiles[rowIndex][colIndex];

                        // We can't move the third row, so we skip it
                        // We could do this by starting the loop lower.
                        if( tile == 0 || rowIndex == 0 ){
                            continue;
                        }

                        // Check for an empty space directly below the tile
                        if( tiles[rowIndex - 1][colIndex] === 0) {

                            // DO THE ANIMATION
                            this.tileObjs.map(function(value) {
                                if( this.row != value.row || this.column != value.column ){
                                    // Not the tile we want
                                    return value;
                                }
                                value.row--;
                                return value;
                            }, {row: (rowIndex + 1), column: (colIndex+1)});

                            tiles[rowIndex - 1][colIndex] = tile;
                            tiles[rowIndex][colIndex] = 0;
                            moved = true;
                            everMoved = true;
                            continue;
                        }

                        // Check for merge
                        if( tiles[rowIndex - 1][colIndex] == tile) {

                            // This is the element we are sliding
                            let collider = this.tileObjs.findIndex(function(tile){
                                return tile.row == this.row && tile.column == this.column && tile.value > 0
                            }, {row: (rowIndex+1), column: (colIndex+1)});

                            // This is the element we want to disappear
                            let collided = this.tileObjs.findIndex(function(tile){
                                return tile.row == this.row && tile.column == this.column && tile.value > 0
                            }, {row: (rowIndex), column: (colIndex+1)});

                            if( this.tileObjs[collider].merged == true || this.tileObjs[collided].merged == true ){
                                // We have already merged this tile, or the one it was supposed to merge into.
                                continue;
                            }

                            this.tileObjs[collider].row--;
                            this.tileObjs[collider].merged=true;
                            this.tileObjs[collider].value *= 2;
                            this.currentScore += this.tileObjs[collider].value;

                            this.tileObjs[collided].value = 0;

                            tiles[rowIndex - 1][colIndex] = tile + tile;
                            tiles[rowIndex][colIndex] = 0;
                            moved = true;
                            everMoved = true;
                            continue;
                        }

                    }
                }
            }while(moved == true);
            this.$set(this.tiles, 0, tiles[0]);
            this.$set(this.tiles, 1, tiles[1]);
            this.$set(this.tiles, 2, tiles[2]);
            this.$set(this.tiles, 3, tiles[3]);
            if(everMoved){
                this.generateRandomTile();
            }
        },
        moveDown: function(){
            // console.log("Down Arrow Pressed");
            var moved, everMoved = false;
            var tiles = this.tiles;

            do{
                moved = false;
                // We're going top to bottom, so we want to move the things closest
                // to the bottom first. That means begin looking at the bottom, and
                // inch our way back up.
                for(let rowIndex = 3; rowIndex >= 0; rowIndex--){
                    // Now we have a row to work with, so let's iterate over the columns.
                    // The order of these doesn't matter much.
                    for(let colIndex = 0; colIndex < 4; colIndex++){

                        let tile = tiles[rowIndex][colIndex];

                        // We can't move the third row, so we skip it
                        // We could do this by starting the loop lower.
                        if( tile == 0 || rowIndex == 3 ){
                            continue;
                        }

                        // Check for an empty space directly below the tile
                        if( tiles[rowIndex + 1][colIndex] == 0) {
                            this.tileObjs.map(function(value) {
                                if( this.row != value.row || this.column != value.column ){
                                    // Not the tile we want
                                    return value;
                                }
                                value.row++;
                                return value;
                            }, {row: (rowIndex + 1), column: (colIndex+1)});
                            tiles[rowIndex + 1][colIndex] = tile;
                            tiles[rowIndex][colIndex] = 0;
                            moved = true;
                            everMoved = true;
                            continue;
                        }

                        // Check for merge
                        if( tiles[rowIndex + 1][colIndex] == tile) {

                            // This is the element we are sliding
                            let collider = this.tileObjs.findIndex(function(tile){
                                return tile.row == this.row && tile.column == this.column && tile.value > 0
                            }, {row: (rowIndex+1), column: (colIndex+1)});

                            // This is the element we want to disappear
                            let collided = this.tileObjs.findIndex(function(tile){
                                return tile.row == this.row && tile.column == this.column && tile.value > 0
                            }, {row: (rowIndex+2), column: (colIndex+1)});

                            if( this.tileObjs[collider].merged == true || this.tileObjs[collided].merged == true ){
                                // We have already merged this tile, or the one it was supposed to merge into.
                                continue;
                            }

                            this.tileObjs[collider].row++;
                            this.tileObjs[collider].merged=true;
                            this.tileObjs[collider].value *= 2;
                            this.currentScore += this.tileObjs[collider].value;

                            this.tileObjs[collided].value = 0;

                            tiles[rowIndex + 1][colIndex] = tile + tile;
                            tiles[rowIndex][colIndex] = 0;
                            moved = true;
                            everMoved = true;
                            continue;
                        }

                    }
                }
            }while(moved == true);
            this.$set(this.tiles, 0, tiles[0]);
            this.$set(this.tiles, 1, tiles[1]);
            this.$set(this.tiles, 2, tiles[2]);
            this.$set(this.tiles, 3, tiles[3]);
            if(everMoved){
                this.generateRandomTile();
            }
        },
        generateRandomTile: function(){
            var empties = [];
            var row, column;
            for(row=0;row<4;row++){
                for(column=0;column<4;column++){
                    if( this.tiles[row][column] == 0 ){
                        empties.push({row:row,column:column});
                    }
                }
            }

            if(empties.length == 0){
                this.checkForGameOver();
                return;
            }
            var randomItem = empties[Math.floor(Math.random()*empties.length)];
            var value = Math.random() < 0.9 ? 2 : 4;
            this.$set(this.tiles[randomItem.row], randomItem.column, value);
            this.$set(this.tileObjs, this.tileObjs.length, {value: value, column:(randomItem.column+1), row:(randomItem.row+1), merged: false});
            this.checkForGameOver();
        },
        checkForGameOver:function() {
            let winTile = this.tileObjs.findIndex(function(tile){
                return tile.value == 2048;
            });

            if(winTile > -1){
                // console.log("Game WON");
                this.gameWon = true;
                this.gameOver = true;
            }

            if(!this.moveAvailable()){
                // Game over!
                // console.log("Game Over");
                this.gameOver = true;
            }
        },
        moveAvailable:function() {
            for(var row=0; row<4; row++){
                for(var column=0; column<4; column++){
                    // Found tile is empty
                    if(this.tiles[row][column] == 0){
                        return true;
                    }

                    // Can move up
                    if(row > 0 && (this.tiles[row-1][column] == 0 || this.tiles[row-1][column] == this.tiles[row][column])){
                        return true;
                    }

                    // Can move Down
                    if(row < 3 && (this.tiles[row+1][column] == 0 || this.tiles[row+1][column] == this.tiles[row][column])){
                        return true;
                    }

                    // Can move right
                    if(column < 3 && (this.tiles[row][column+1] == 0 || this.tiles[row][column+1] == this.tiles[row][column])){
                        return true;
                    }

                    // Can move Left
                    if(column > 0 && (this.tiles[row][column-1] == 0 || this.tiles[row][column-1] == this.tiles[row][column])){
                        return true;
                    }

                }
            }
            return false;
        },
        handleKeypress: function(keyCode){
            if([37,38,39,40,65,68,83,87].indexOf(keyCode) < 0){
                return;
            }

            if( keyCode==38 || keyCode==87){
                this.moveUp();
            }
            if( keyCode==37 || keyCode==65 ){
                this.moveLeft();
            }
            if( keyCode==39 || keyCode==68){
                this.moveRight();
            }
            if( keyCode==40 || keyCode==83){
                this.moveDown();
            }

            this.tileObjs.map(function(tile){
                tile.merged = false;
            })

        },
        swipeLeft: function() {
            this.moveLeft();

            this.tileObjs.map(function(tile){
                tile.merged = false;
            });
        },
        swipeRight: function() {
            this.moveRight();

            this.tileObjs.map(function(tile){
                tile.merged = false;
            });
        },
        swipeUp: function() {
            this.moveUp();

            this.tileObjs.map(function(tile){
                tile.merged = false;
            });
        },
        swipeDown: function() {
            this.moveDown();

            this.tileObjs.map(function(tile){
                tile.merged = false;
            });
        },

    },
    watch:{
        gameNumber: function(){
            this.tileObjs = [];
            this.tiles = [
                    [0,0,0,0],
                    [0,0,0,0],
                    [0,0,0,0],
                    [0,0,0,0]
           ];
           this.gameOver = false;
           this.gameWon = false;
           this.currentScore = 0;
           this.generateRandomTile();
           this.generateRandomTile();

        },
        currentScore: function(newVal){
            this.$emit('updateScore', newVal);
        }
    }
}
</script>
