<template>
	<div class="container">

	<div id="app" class="app">
		<router-view />
	</div>
	</div>
</template>

<script>
const conf = require("./conf.js")


export default {
	name: 'app',
	data() {
		return {
			conf: conf
		}
	},
}
</script>

