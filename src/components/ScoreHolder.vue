<template>
    <div class="relative text-center rounded ml-3 flex-grow" style="background:#bbada0;">
        <span class="score-name">{{scoreName}}</span>
        <span class="score"><slot></slot></span>
    </div>
</template>
<style scoped>
    .score-name {
        position: absolute;
        width: 100%;
        top: 10px;
        left: 0;
        text-transform: uppercase;
        font-size: 13px;
        line-height: 13px;
        text-align: center;
        color: #eee4da;
        z-index:2;
    }
    .score {
        position: relative;
        display: inline-block;
        background: #bbada0;
        padding: 15px 25px;
        font-size: 25px;
        height: 25px;
        line-height: 47px;
        font-weight: bold;
        border-radius: 3px;
        color: white;
        margin-top: 3px;
        text-align: center;
    }
</style>
<script>
    export default {
        props: ['scoreName'],
    }
</script>
