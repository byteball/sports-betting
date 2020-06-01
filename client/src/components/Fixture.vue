<template>

	<div class="tile is-3 is-parent">
	<article class="tile is-child notification is-info">
		<p class="title is-5">{{fixture.homeTeam}} vs {{fixture.awayTeam}}</p>
		<p class="title is-5"> on {{fixture.localDay}}</p>
		<div v-if="!fixture.result">
			<div v-if="!fixture.aa_address">
				<a :href='issuer_creation_link'> Create asset issuer</a>
			</div>
			<div v-else>
				<span @click="openIssueAssetsModal">Issue assets</span>
			</div>
				{{fixture.result}}
			<div v-if="fixture.assets">
				<div>
					Trade asset:
				</div>
				<div><a :href="odex_base_url +'trade/' + fixture.home_asset_symbol  + '/GBYTE'">{{fixture.homeTeam}} win</a></div>
				<div><a :href="odex_base_url +'trade/' + fixture.away_asset_symbol + '/GBYTE'">{{fixture.awayTeam}} win</a></div>
				<div><a :href="odex_base_url +'trade/' + fixture.draw_asset_symbol + '/GBYTE'">Draw</a></div>
				<div><a :href="odex_base_url +'trade/' + fixture.canceled_asset_symbol + '/GBYTE'">Canceled</a></div>
			</div>
			<div v-else>
				<div v-if="fixture.result == fixture.feedHomeTeamName">
					{{fixture.homeTeam}} won
					<div v-if="fixture.assets">
						Redeem {{fixture.home_asset_symbol}}
					</div>
				</div>
				<div v-if="fixture.result == fixture.feedAwayTeamName ">
					{{fixture.awayTeam}} won
					<div v-if="fixture.assets">
						Redeem {{fixture.away_asset_symbol}}
					</div>
				</div>
				<div v-if="fixture.result == 'draw'">
					Draw result
					<div v-if="fixture.assets">
						Redeem {{fixture.draw_asset_symbol}}
					</div>
				</div>
				<div v-if="fixture.result == 'canceled'">
					Canceled fixture
					<div v-if="fixture.assets">
						Redeem {{fixture.canceled_asset_symbol}}
					</div>
				</div>
			</div>
		</div>
	</article>
	</div>

</template>

<script>

import {odex_base_url, testnet, oracle_address, issuer_base_aa, protocol } from '../conf.js'
import IssueAssetsModal from './IssueAssetsModal.vue'


export default {
	components: {
	
	},
	props: {
		fixture: Object
	},
	data() {
		return {
			datafeed: '',
			odex_base_url: odex_base_url,
			issuer_creation_link: null,
			home_asset_symbol: '',
			away_asset_symbol: '',
			draw_asset_symbol: '',
			canceled_asset_symbol: '',

		}
	},

	created(){

		const feedName = this.fixture.championship + '_' + this.fixture.feedHomeTeamName + '_' + this.fixture.feedAwayTeamName + '_' + this.fixture.localDay;
		this.fixture.home_asset_symbol = feedName + '-' + this.fixture.feedHomeTeamName;
		this.fixture.away_asset_symbol = feedName + '-' + this.fixture.feedAwayTeamName;
		this.fixture.draw_asset_symbol = feedName + '-DRAW';
		this.fixture.canceled_asset_symbol = feedName + '-CANCELED';

			var definition = `{
				"base_aa": "${issuer_base_aa}",
				"params": {
					"oracle": "${oracle_address}",
					"home_team": "${this.fixture.feedHomeTeamName}",
					"away_team": "${this.fixture.feedAwayTeamName}", 
					"championship": "${this.fixture.championship}", 
					"expiry_date": "${this.fixture.localDay}", 
				}
			}`;
			var json_string = JSON.stringify(definition);
			var base64data = encodeURIComponent(btoa(json_string));
			this.issuer_creation_link = protocol+":data?app=definition&definition="+encodeURIComponent(definition);

	},
	watch:{

	},
	methods: {
		openIssueAssetsModal(){
			this.$buefy.modal.open({
				parent: this,
				component: IssueAssetsModal,
				hasModalCard: true,
				props: {
					fixture: this.fixture,
				},
				onCancel:()=>{

				},
			//	customClass: 'custom-class custom-class-2'
			})
		}
	
	}
}
</script>


<style lang='scss' scoped>

</style>


