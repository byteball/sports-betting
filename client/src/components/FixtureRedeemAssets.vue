<template>
	<div v-if="fixture.assets">
		<b-tooltip :label="$t('toolTipRedeem', {symbol: fixture.away_asset_symbol})">	
			Redeem winning asset 	<a :href="redeem_home_asset_link">
			<b-icon class="ml-05" icon="open-in-new"/></a>
		</b-tooltip>
	</div>
</template>
<script>

import { protocol } from '../conf.js'

export default {
	props: {
		fixture: Object
	},
	data() {
		return {

		}
	},
	created(){
			if (this.fixture.assets){
				if (this.fixture.result == this.fixture.feedHomeTeamName)
					this.asset = this.fixture.assets.home;
				else if (this.fixture.result == this.fixture.feedAwayTeamName)
					this.asset = this.fixture.assets.away;
				else if (this.fixture.result == 'draw')
					this.asset = this.fixture.assets.draw;
				else if (this.fixture.result == 'canceled')
					this.asset = this.fixture.assets.canceled;
				this.redeem_home_asset_link = protocol+":"+ this.fixture.aa_address+"?asset="+encodeURIComponent(this.asset);
			}


	}
}
</script>
