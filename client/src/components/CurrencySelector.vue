<template>
	<b-field label="Currency">
		<b-select v-model="input">
			<option
				v-for="(value,key) in $store.state.currencies"
				:key="key"
				:value="key"
			>
			{{key}}
			</option>
		</b-select>
	</b-field>
</template>
<script>

import Vue from 'vue'
import conf from "../js/conf.js"

export default {
	components: {
	},
	props: ['value'],
	data() {
		return {
			input: null
		}
	},
	created(){
		if (localStorage.preferedCurrency){
			this.input = localStorage.preferedCurrency;
		} else {
			this.input = conf.defaultCurrency;
		}
		this.$store.commit('setSelectedCurrency', this.input);
	},
	watch: {
		input(value) {
			this.$store.commit('setSelectedCurrency', value);
			localStorage.preferedCurrency = value;
			this.$emit('input', value);
		},
		value(value) {
			this.input = value;
		}
	},
	methods: {

	}
}
</script>


<style lang='scss' scoped>
</style>


