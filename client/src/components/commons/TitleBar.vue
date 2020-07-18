<template>
	<div class="columns">
		<div class="column">
			<a href="/"><h2 class="title is-2 p-05">{{conf.website_name}}</h2></a>
		</div>
			<div class="column">
			<slot></slot>
		</div>
	</div>
</template>


<script>

const conf = require("../../js/conf.js")

export default {

	data() {
		return {
			conf: conf,
		}
	},

}

</script>
