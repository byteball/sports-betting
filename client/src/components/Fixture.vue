<template>

	<div class="tile is-3 is-parent">
		<article :class="getArticleClass">
			<div style="min-height:8rem;">
				<p class="title is-5">{{fixture.homeTeam}} vs {{fixture.awayTeam}}</p>
				<p class="title is-5"> on {{fixture.localDay}}</p>
			</div>
			<div v-if="!fixture.result">
				<div v-if="!comingFixture">
					{{$t('noResultInDag')}} 
				</div>
				<hr>
				<div v-if="!hasAssetsIssued && comingFixture">
				<b-tooltip :label="$t('toolTipCreateIssuer')">
					{{$t('createAssetIssuer')}}: <a :href='issuer_creation_link'> <b-icon class="ml-05" icon="open-in-new"/></a>
				</b-tooltip>
				<hr>
				</div>
				<div v-else-if="comingFixture">
					<b-tooltip :label="$t('toolTipIssueAssets', {symbol: $store.state.selectedOperatingSymbol})">
						<span>{{$t('issueAssets')}}:<a @click="openIssueAssetsModal"><b-icon class="ml-05" icon="swap-horizontal-bold"/></a></span>
					</b-tooltip>
				</div>
			</div>

			<div v-else>
				<result :fixture="fixture"/>
				<hr>
				<redeem-assets class="mt-05" :fixture="fixture"/>
			</div>
			<div v-if="hasAssetsIssued">
				<hr>
				<div class="mt-1 mb-05 has-text-centered">
					<b-tooltip :label="$t('toolTipTradeAssets')"><p class="title is-5">{{$t('tradeAssets')}}</p></b-tooltip>
				</div>
				<table>
					<tr>
						<th>
							Result
						</th>
						<th>
							Odds
						</th>
						<th>
						</th>
					</tr>
					<tr>
						<th class="pr-05">
							<b-tooltip :label="$t('toolTipTradeTeamAsset', {team: fixture.homeTeam, symbol: $store.state.selectedOperatingSymbol})">
								{{fixture.homeTeam}}
							</b-tooltip>
						</th>
						<th>
							{{bestHomeOdds}}
						</th>
						<th>
							<a :href="odex_base_url +'trade/' + fixture.home_asset_symbol  + '/' + $store.state.selectedOperatingSymbol" target="_blank">
								<b-icon class="ml-05" icon="open-in-new"/>
							</a>
						</th>
					</tr>
					<tr>
						<th>
							<b-tooltip :label="$t('toolTipTradeDrawAsset')">
								Draw
							</b-tooltip>
						</th>
						<th>
							{{bestDrawOdds}}
						</th>
						<th>
							<a :href="odex_base_url +'trade/' + fixture.draw_asset_symbol  + '/' + $store.state.selectedOperatingSymbol" target="_blank">
								<b-icon class="ml-05" icon="open-in-new"/>
							</a>
						</th>
					</tr>
					<tr>
						<th class="pr-05">
							<b-tooltip :label="$t('toolTipTradeTeamAsset', {team: fixture.awayTeam, symbol: $store.state.selectedOperatingSymbol})">
								{{fixture.awayTeam}}
							</b-tooltip>
						</th>
						<th>
							{{bestAwayOdds}}
						</th>
						<th>
							<a :href="odex_base_url +'trade/' + fixture.away_asset_symbol  + '/' + $store.state.selectedOperatingSymbol" target="_blank">
								<b-icon class="ml-05" icon="open-in-new"/>
							</a>
						</th>
					</tr>
					<tr>
						<th>
							<b-tooltip :label="$t('toolTipTradeCanceledAsset', {symbol: $store.state.selectedOperatingSymbol})">
								Canceled
							</b-tooltip>
						</th>
						<th>
							{{bestCanceledOdds}}
						</th>
						<th>
							<a :href="odex_base_url +'trade/' + fixture.canceled_asset_symbol  + '/' + $store.state.selectedOperatingSymbol" target="_blank">
								<b-icon class="ml-05" icon="open-in-new"/>
							</a>
						</th>
					</tr>
				</table>
			</div>
		</article>
	</div>

</template>

<script>

import {odex_base_url, testnet, oracle_address, issuer_base_aa, protocol } from '../js/conf.js'
import IssueAssetsModal from './IssueAssetsModal.vue'
import Result from './FixtureResult.vue'
import RedeemAssets from './FixtureRedeemAssets.vue'
import { mapState } from 'vuex';


export default {
	components: {
		Result,
		RedeemAssets
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
			home_asset_symbol: '',
			away_asset_symbol: '',
			draw_asset_symbol: '',
			canceled_asset_symbol: '',
		}
	},

	created(){
		this.init();
	},

	computed:{
		...mapState(['selectedOperatingAsset']),
		getArticleClass: function(){
			return "tile is-child notification " + this.type;
		},
		bestHomeOdds: function(){
			return this.getBestOddsForPair(this.fixture.home_asset_symbol  + '/' + this.$store.state.selectedOperatingSymbol);
		},
		bestAwayOdds: function(){
			return this.getBestOddsForPair(this.fixture.away_asset_symbol  + '/' + this.$store.state.selectedOperatingSymbol);
		},
		bestDrawOdds: function(){
			return this.getBestOddsForPair(this.fixture.draw_asset_symbol  + '/' + this.$store.state.selectedOperatingSymbol);
		},
		bestCanceledOdds: function(){
			return this.getBestOddsForPair(this.fixture.canceled_asset_symbol  + '/' + this.$store.state.selectedOperatingSymbol);
		},
		issuer_creation_link: function(){
			const reserve_asset = this.$store.state.currencies[this.$store.state.selectedOperatingSymbol].asset;
			const definition = `{
				"base_aa": "${issuer_base_aa}",
				"params": {
					"oracle": "${oracle_address}",
					"home_team": "${this.fixture.feedHomeTeamName}",
					"away_team": "${this.fixture.feedAwayTeamName}", 
					"championship": "${this.fixture.championship}", 
					"fixture_date": "${this.fixture.localDay}", 
					"reserve_asset":"${reserve_asset}"
				}
			}`;
			var json_string = JSON.stringify(definition);
			var base64data = encodeURIComponent(btoa(json_string));
			return protocol+":data?app=definition&definition="+encodeURIComponent(definition);
		},
		hasAssetsIssued: function(){
			const reserve_asset = this.$store.getters.selectedOperatingAsset;
			if (reserve_asset && this.fixture.currencies && this.fixture.currencies[reserve_asset])
				return true;
			return false;
		},
	},
	watch:{
		fixture: function(){
			this.init();
		},
		selectedOperatingAsset: function(){

		}
	},
	methods: {

		init: function(){
			const reserve_asset = this.$store.getters.selectedOperatingAsset;
			const feedName = this.fixture.championship + '_' + this.fixture.feedHomeTeamName + '_' + this.fixture.feedAwayTeamName + '_' + this.fixture.localDay;
			this.fixture.home_asset_symbol = feedName + '-' + this.fixture.feedHomeTeamName + '-' + this.$store.state.selectedOperatingSymbol;
			this.fixture.away_asset_symbol = feedName + '-' + this.fixture.feedAwayTeamName+ '-' + this.$store.state.selectedOperatingSymbol;
			this.fixture.draw_asset_symbol = feedName + '-DRAW'+ '-' + this.$store.state.selectedOperatingSymbol;
			this.fixture.canceled_asset_symbol = feedName + '-CANCELED'+ '-' + this.$store.state.selectedOperatingSymbol;

			if(this.fixture.currencies && this.fixture.currencies[reserve_asset] && this.fixture.currencies[reserve_asset].assets){
				function subscribe(result){
					const ws = require('../js/websocket.js');
					ws.subscribeOrderbook(this.fixture.assets.currencies[reserve_asset][result], 
					this.$store.getters.selectedOperatingAsset, 
					this.fixture[result+'_asset_symbol'] + this.$store.state.selectedOperatingSymbol);
				}

				if (!this.$store.state.subscribed_assets[this.fixture.currencies[reserve_asset].assets.home])
					subscribe('home');
				if (!this.$store.state.subscribed_assets[this.fixture.currencies[reserve_asset].assets.away])
					subscribe('away');
				if (!this.$store.state.subscribed_assets[this.fixture.currencies[reserve_asset].assets.draw])
					subscribe('draw');
				if (!this.$store.state.subscribed_assets[this.fixture.currencies[reserve_asset].assets.canceled])
					subscribe('canceled');
			}

		},

		getBestOddsForPair: function(pair){
			if (!this.$store.state.best_ask_odds_by_pair[pair])
				return 'n/a';
			return (1/this.$store.state.best_ask_odds_by_pair[pair]).toFixed(2); 
		},
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
th {
	color:currentcolor;
}


</style>


