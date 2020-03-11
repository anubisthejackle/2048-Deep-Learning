<template>
    <div class="grid-row">
        <grid-cell v-for="(i,index) in 4" :key="index" />
    </div>
</template>

<style scoped>
    .grid-row {
        margin-bottom: 15px;
    }
    .grid-row:after {
        content: "";
        display: block;
        clear: both;
    }
</style>

<script>
import GridCell from './GridCell.vue';
export default {
    components: {
        'grid-cell': GridCell
    },
    data() {
        return {

        }
    }
}
</script>
