<template>
    <transition name="fade" :duration="500">
        <div v-if="gameOver && !gameWon" class="flex items-center justify-center text-center absolute top-0 left-0 z-50 bg-white w-full opacity-75 h-full">
            <div class="text-3xl font-bold">Game Over</div>
        </div>
        <div v-if="gameOver && gameWon" class="flex items-center justify-center text-center absolute top-0 left-0 z-50 bg-white w-full opacity-75 h-full">
            <div class="text-3xl font-bold">Game Won</div>
        </div>
    </transition>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
    transition: opacity .5s
}
.fade-enter, .fade-leave-to /* .fade-leave-active in <2.1.8 */ {
    opacity: 0
}
</style>

<script>
    export default {
        props:['gameOver','gameWon']
    }
</script>
