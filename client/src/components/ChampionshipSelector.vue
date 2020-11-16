<template>
	<div class="field" >
		<b-switch
			v-for="(value,key) in filters" 
			v-model="input[key]"
			@input="onInput"
			:key="'button_'+key"
			size="is-small"
		>
		{{$t(key)}}
		</b-switch>
	</div>
</template>
<script>

import Vue from 'vue'

export default {
	components: {
	},
	props: ['value', 'filters'],
	data() {
		return {
			input: null
		}
	},
	created(){

	},
	watch: {
		value(value) {
			this.input = value;
		}
	},
	methods: {
		onInput: function(key, value){
			this.$emit('input', this.input);
		}
	}
}
</script>


<style lang='scss' scoped>
</style>


