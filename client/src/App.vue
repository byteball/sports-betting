<template>
	<div class="container">
		<b-navbar>
			<template slot="brand">
				<b-navbar-item tag="router-link" :to="{ path: '/' }">
					<h1 class="title is-1">{{conf.website_name}}</h1>
				</b-navbar-item>
			</template>
		</b-navbar>
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

