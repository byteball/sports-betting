<template>
	<div v-if="redeem_link">
		<b-tooltip :label="$t('toolTipRedeem', {symbol: fixture.away_asset_symbol, operatingSymbol: $store.state.selectedOperatingSymbol})">	
			Redeem winning asset 	<a :href="redeem_link">
			<b-icon class="ml-05" icon="open-in-new"/></a>
		</b-tooltip>
	</div>
</template>
<script>

import { protocol } from '../js/conf.js'

export default {
	props: {
		fixture: Object
	},
	data() {
		return {

		}
	},
	computed: {
		redeem_link() {
			var asset;
			const operating_asset = this.$store.getters.selectedOperatingAsset;
			if (operating_asset && this.fixture.currencies && this.fixture.currencies[operating_asset]){
				if (this.fixture.result == this.fixture.feedHomeTeamName)
					asset = this.fixture.currencies[operating_asset].assets.home;
				else if (this.fixture.result == this.fixture.feedAwayTeamName)
					asset = this.fixture.currencies[operating_asset].assets.away;
				else if (this.fixture.result == 'draw')
					asset = this.fixture.currencies[operating_asset].assets.draw;
				else if (this.fixture.result == 'canceled')
					asset = this.fixture.currencies[operating_asset].assets.canceled;
				return protocol+":"+ this.fixture.currencies[operating_asset].aa_address+"?asset="+encodeURIComponent(asset);
			} else
				return false;
		}
	},
	created(){

	}
}
</script>
