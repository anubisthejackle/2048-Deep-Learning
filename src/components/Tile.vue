<template>
    <div
        :style="{transform: `${tilePosition}` }"
        class="tile"
        :class="`${dynamicClass}`"
    >
        <div class="tile-inner">{{ tileValue }}</div>
    </div>
</template>

<style scoped>
    .tile {
        position: absolute;
        -webkit-transition: 100ms ease-in-out;
        -moz-transition: 100ms ease-in-out;
        transition: 100ms ease-in-out;
        -webkit-transition-property: -webkit-transform;
        -moz-transition-property: -moz-transform;
        transition-property: transform;
    }
    .tile, .tile .tile-inner {
        width: 107px;
        height: 107px;
        line-height: 107px;
    }

    .tile .tile-inner {
        border-radius: 3px;
        background: #eee4da;
        text-align: center;
        font-weight: bold;
        z-index: 10;
        font-size: 55px;
    }
    .tile.tile-0 {
        display: none;
    }
    .tile.tile-2 .tile-inner {
        background: #eee4da;
        box-shadow: 0 0 30px 10px rgba(243, 215, 116, 0), inset 0 0 0 1px rgba(255, 255, 255, 0);
    }
    .tile.tile-4 .tile-inner {
        background: #ede0c8;
        box-shadow: 0 0 30px 10px rgba(243, 215, 116, 0), inset 0 0 0 1px rgba(255, 255, 255, 0);
    }
    .tile.tile-8 .tile-inner {
        color: #f9f6f2;
        background: #f2b179;
    }
    .tile.tile-16 .tile-inner {
        color: #f9f6f2;
        background: #f59563;
    }
    .tile.tile-32 .tile-inner {
        color: #f9f6f2;
        background: #f67c5f;
    }
    .tile.tile-64 .tile-inner {
        color: #f9f6f2;
        background: #f65e3b;
    }
    .tile.tile-128 .tile-inner {
        color: #f9f6f2;
        background: #edcf72;
        box-shadow: 0 0 30px 10px rgba(243, 215, 116, 0.2381), inset 0 0 0 1px rgba(255, 255, 255, 0.14286);
        font-size: 45px;
    }
    @media screen and (max-width: 520px) {
        .tile.tile-128 .tile-inner {
            font-size: 25px;
        }
    }
    .tile.tile-256 .tile-inner {
        color: #f9f6f2;
        background: #edcc61;
        box-shadow: 0 0 30px 10px rgba(243, 215, 116, 0.31746), inset 0 0 0 1px rgba(255, 255, 255, 0.19048);
        font-size: 45px;
    }
    @media screen and (max-width: 520px) {
        .tile.tile-256 .tile-inner {
            font-size: 25px;
        }
    }
    .tile.tile-512 .tile-inner {
        color: #f9f6f2;
        background: #edc850;
        box-shadow: 0 0 30px 10px rgba(243, 215, 116, 0.39683), inset 0 0 0 1px rgba(255, 255, 255, 0.2381);
        font-size: 45px;
    }
    @media screen and (max-width: 520px) {
        .tile.tile-512 .tile-inner {
            font-size: 25px;
        }
    }
    .tile.tile-1024 .tile-inner {
        color: #f9f6f2;
        background: #edc53f;
        box-shadow: 0 0 30px 10px rgba(243, 215, 116, 0.47619), inset 0 0 0 1px rgba(255, 255, 255, 0.28571);
        font-size: 35px;
    }
    @media screen and (max-width: 520px) {
        .tile.tile-1024 .tile-inner {
            font-size: 15px;
        }
    }
    .tile.tile-2048 .tile-inner {
        color: #f9f6f2;
        background: #edc22e;
        box-shadow: 0 0 30px 10px rgba(243, 215, 116, 0.55556), inset 0 0 0 1px rgba(255, 255, 255, 0.33333);
        font-size: 35px;
    }
    @media screen and (max-width: 520px) {
        .tile.tile-2048 .tile-inner {
            font-size: 15px;
        }
    }
    .tile.tile-super .tile-inner {
        color: #f9f6f2;
        background: #3c3a32;
        font-size: 30px;
    }
    @media screen and (max-width: 520px) {
        .tile.tile-super .tile-inner {
            font-size: 10px;
        }
    }
@-webkit-keyframes pop {
    0% {
        -webkit-transform: scale(0);
        -moz-transform: scale(0);
        -ms-transform: scale(0);
        transform: scale(0);
    }

    50% {
        -webkit-transform: scale(1.2);
        -moz-transform: scale(1.2);
        -ms-transform: scale(1.2);
        transform: scale(1.2);
    }

    100% {
        -webkit-transform: scale(1);
        -moz-transform: scale(1);
        -ms-transform: scale(1);
        transform: scale(1);
    }
}
@-moz-keyframes pop {
    0% {
        -webkit-transform: scale(0);
        -moz-transform: scale(0);
        -ms-transform: scale(0);
        transform: scale(0);
    }

    50% {
        -webkit-transform: scale(1.2);
        -moz-transform: scale(1.2);
        -ms-transform: scale(1.2);
        transform: scale(1.2);
    }

    100% {
        -webkit-transform: scale(1);
        -moz-transform: scale(1);
        -ms-transform: scale(1);
        transform: scale(1);
    }
}
@keyframes pop {
    0% {
        -webkit-transform: scale(0);
        -moz-transform: scale(0);
        -ms-transform: scale(0);
        transform: scale(0);
    }

    50% {
        -webkit-transform: scale(1.2);
        -moz-transform: scale(1.2);
        -ms-transform: scale(1.2);
        transform: scale(1.2);
    }

    100% {
        -webkit-transform: scale(1);
        -moz-transform: scale(1);
        -ms-transform: scale(1);
        transform: scale(1);
    }
}
    .tile-merged .tile-inner {
        z-index: 20;
        -webkit-animation: pop 200ms ease 100ms;
        -moz-animation: pop 200ms ease 100ms;
        animation: pop 200ms ease 100ms;
        -webkit-animation-fill-mode: backwards;
        -moz-animation-fill-mode: backwards;
        animation-fill-mode: backwards;
    }

</style>

<script>
    export default {
        props: ['tileValue', 'tileColumn', 'tileRow','merged'],
        computed: {
            tilePosition() {
                // This is where we compute the tile position style and pass it dynamically to the inline style
                // return value should look like `translate(COLUMN PIXELS, ROW PIXELS)`
                let column = ((this.tileColumn - 1) * 121);
                let row = ((this.tileRow - 1) * 121);

                return `translate(${column}px, ${row}px)`
            },

            dynamicClass() {
                var cssClass = "tile-" + this.tileValue;
                if(this.merged == true){
                    cssClass = cssClass + " tile-merged";
                }
                return cssClass;
            }
        }
    }
</script>
