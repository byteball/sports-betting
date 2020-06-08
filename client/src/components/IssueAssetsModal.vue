<template>
	<form action="">
		<div class="modal-card" style="min-width:400px;">
			<header class="modal-card-head">
				<p class="modal-card-title">{{$t('issueAssetsModalTitle')}}</p>
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
						<div>{{amount}} <b-tooltip :label="$t('toolTipIssueTeamAsset', {amount: amount, team: fixture.homeTeam})"><b>{{fixture.home_asset_symbol}}</b></b-tooltip></div>
						<div>{{amount}} <b-tooltip :label="$t('toolTipIssueTeamAsset', {amount: amount, team: fixture.awayTeam})"><b>{{fixture.away_asset_symbol}}</b></b-tooltip></div>
						<div>{{amount}} <b-tooltip :label="$t('toolTipIssueDrawAsset', {amount: amount})"><b>{{fixture.draw_asset_symbol}}</b></b-tooltip></div>
						<div>{{amount}} <b-tooltip :label="$t('toolTipIssueCanceledAsset', {amount: amount})"><b>{{fixture.canceled_asset_symbol}}</b></b-tooltip></div>
					</div>
				</div>
				<div>
					<div class="pl-2">							<a :href="link">
						<p class="is-3">Send transaction:</p>
							<b-icon 
								icon='open-in-new'
								size="is-large"
							/>
						</a>
					</div>
				</div>
			</section>
			<footer class="modal-card-foot">
				<button class="button" type="button" @click="closeModal">Close</button>
			</footer>
		</div>
	</form>
</template>

<script>

const conf = require("../conf.js");

export default {
	components: {

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
		closeModal: function(){
			this.$parent.close()
		},

	}
}
</script>
