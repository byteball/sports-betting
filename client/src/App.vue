<template>
	<div class="container">

	<div id="app" class="app">
		<router-view />
	</div>
	</div>
</template>

<script>
const conf = require("./js/conf.js")
const ws = require('./js/websocket.js');


export default {
	name: 'app',
	data() {
		return {
			conf: conf
		}
	},
	created(){
		ws.setStore(this.$store);
		this.$store.dispatch('fetchCurrencies');
	}
}
</script>

