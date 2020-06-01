<template>
	<form action="">
		<div class="modal-card" style="min-width:400px;">
			<header class="modal-card-head">
				<p class="modal-card-title">Issue assets</p>
			</header>
			<section  class="modal-card-body" >
				<div ref="div-create" class="p-2">
					<b-field label="Amount" >
						<b-slider
						class="is-primary"
						v-model="amount" 
						:min="0.001" 
						:max="100" 
						:step="0.001"
						:custom-formatter="val => val + ' GB'">
						</b-slider>
					</b-field>
					<b-numberinput 
					v-model="amount"
					:controls="false"
					label="GB"
					/>
					<div v-if="amount">
						<div>Send {{amount}} <b>GB</b> receive:</div>
						<div>{{amount}} <b>{{fixture.home_asset_symbol}}</b></div>
						<div>{{amount}} <b>{{fixture.away_asset_symbol}}</b></div>
						<div>{{amount}} <b>{{fixture.draw_asset_symbol}}</b></div>
						<div>{{amount}} <b>{{fixture.canceled_asset_symbol}}</b></div>
					</div>
				</div>
				<div>
					<icon-link v-if="amount" :link="link" />
				</div>
			</section>
			<footer class="modal-card-foot">
				<button class="button" type="button">Close</button>
			</footer>
		</div>
	</form>
</template>

<script>

const conf = require("../conf.js");
import IconLink from './commons/IconLink.vue'

export default {
	components: {
		IconLink
	},
	props: {
		fixture: Object
	},
	data() {
		return {
			conf: conf,
			amount: 0.001
		}
	},
	computed: {
		link() {
			return conf.protocol+":"+this.fixture.aa_address+"?amount="
				+Math.round(this.amount * conf.gb_to_bytes);
		}
	},
	watch:{

	},
	created(){
		console.log(conf.gb_to_bytes);

	},
	methods:{


	}
}
</script>
