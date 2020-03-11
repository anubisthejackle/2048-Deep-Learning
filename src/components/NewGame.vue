<template>
    <div v-on:click.stop.prevent="clicked" class="cursor-pointer text-center align-middle rounded pl-5 pr-5 pt-2 pb-2 h-auto" style="background:#8f7a66;">
        <a href="#" class="font-semibold text-white text-lg"><slot></slot></a>
    </div>
</template>

<script>
    export default {
        props: ['scoreName'],
        methods:{
            clicked:function() {
                this.$emit("clicked");
            }
        }
    }
</script>
