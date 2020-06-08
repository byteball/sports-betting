<template>

	<div class="tile is-3 is-parent">
		<article :class="getArticleClass">
			<div style="min-height:8rem;">
				<p class="title is-5">{{fixture.homeTeam}} vs {{fixture.awayTeam}}</p>
				<p class="title is-5"> on {{fixture.localDay}}</p>
			</div>
			<div v-if="!fixture.result">
				<div v-if="!fixture.aa_address&&comingFixture">
				<b-tooltip :label="$t('toolTipCreateIssuer')">
					{{$t('createAssetIssuer')}}: <a :href='issuer_creation_link'> <b-icon class="ml-05" icon="open-in-new"/></a>
				</b-tooltip>
				</div>
				<div v-else-if="comingFixture">
					<b-tooltip :label="$t('toolTipIssueAssets')">
						<span @click="openIssueAssetsModal"><a>{{$t('issueAssets')}}</a></span>
					</b-tooltip>
				</div>
					{{fixture.result}}
				<div v-if="fixture.assets">
					<div class="mt-1">
						<b-tooltip :label="$t('toolTipTradeAssets')">{{$t('tradeAssets')}}</b-tooltip>
					</div>
					<div>
						<b-tooltip :label="$t('toolTipTradeTeamAsset', {team: fixture.homeTeam})">
							{{fixture.homeTeam}} wins
						</b-tooltip>
						<a :href="odex_base_url +'trade/' + fixture.home_asset_symbol  + '/GBYTE'" target="_blank">
							<b-icon class="ml-05" icon="open-in-new"/>
						</a>
					</div>
					<div>
						<b-tooltip :label="$t('toolTipTradeTeamAsset', {team: fixture.awayTeam})">
							{{fixture.awayTeam}} wins
						</b-tooltip>
						<a :href="odex_base_url +'trade/' + fixture.away_asset_symbol + '/GBYTE'" target="_blank">
						 <b-icon class="ml-05" icon="open-in-new"/>
						</a>
					</div>
					<div>
						<b-tooltip :label="$t('toolTipTradeDrawAsset')">
							Draw
						</b-tooltip>
						<a :href="odex_base_url +'trade/' + fixture.draw_asset_symbol + '/GBYTE'" target="_blank">
							<b-icon class="ml-05" icon="open-in-new"/>
						</a>
					</div>
					<div>
						<b-tooltip :label="$t('toolTipTradeCanceledAsset')">
							Canceled
						</b-tooltip>
						<a :href="odex_base_url +'trade/' + fixture.canceled_asset_symbol + '/GBYTE'" target="_blank">
							<b-icon class="ml-05" icon="open-in-new"/>
						</a>
					</div>
				</div>
				<div v-if="!comingFixture">
					{{$t('noResultInDag')}} 
				</div>
			</div>

			<div v-else>
				<div v-if="fixture.result == fixture.feedHomeTeamName">
					{{fixture.homeTeam}} won
					<div v-if="fixture.assets">
						<a :href="redeem_home_asset_link">Redeem winning asset {{fixture.home_asset_symbol}}<b-icon size="is-small" class="ml-05" icon="open-in-new"/></a>
					</div>
				</div>
				<div v-else-if="fixture.result == fixture.feedAwayTeamName ">
					{{fixture.awayTeam}} won
					<div v-if="fixture.assets">
						<b-tooltip :label="'Swap ' + fixture.away_asset_symbol + ' for the same amount of GB'">	
						Redeem winning asset 	<a :href="redeem_away_asset_link">
			
								<b-icon size="is-small" class="ml-05" icon="open-in-new"/></a>
				</b-tooltip>
					</div>
				</div>
				<div v-else-if="fixture.result == 'draw'">
					Draw result
					<div v-if="fixture.assets">
						<a :href="redeem_draw_asset_link">Redeem {{fixture.draw_asset_symbol}}<b-icon size="is-small" class="ml-05" icon="open-in-new"/></a>
					</div>
				</div>
				<div v-else-if="fixture.result == 'canceled'">
					Canceled fixture
					<div v-if="fixture.assets">
						<a :href="redeem_canceled_asset_link">Redeem {{fixture.canceled_asset_symbol}}<b-icon size="is-small" class="ml-05" icon="open-in-new"/></a>
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
		fixture: Object,
		type: String,
		comingFixture: Boolean
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
		console.log(this.type);
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
			if (this.fixture.assets){
				this.redeem_home_asset_link = protocol+":"+ this.fixture.aa_address+"?asset="+encodeURIComponent(this.fixture.assets.hometeam);
				this.redeem_away_asset_link = protocol+":"+ this.fixture.aa_address+"?asset="+encodeURIComponent(this.fixture.assets.awayteam);
				this.redeem_draw_asset_link = protocol+":"+ this.fixture.aa_address+"?asset="+encodeURIComponent(this.fixture.assets.draw);
				this.redeem_canceled_asset_link = protocol+":"+ this.fixture.aa_address+"?asset="+encodeURIComponent(this.fixture.assets.canceled);
			}
	},
	computed:{
		getArticleClass: function(){
			return "tile is-child notification " + this.type;
		}
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
			})
		}
	
	}
}
</script>


<style lang='scss' scoped>

</style>


