import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'


Vue.use(Vuex)

export default new Vuex.Store({
	state: {
		subscribed_assets: {},
		best_ask_odds_by_pair: {},
		currencies: [],
		selectedOperatingSymbol: null,
		isInitialized: false
	},
	getters: {
		selectedOperatingAsset: (state) => {
			return state.currencies[state.selectedOperatingSymbol].asset;
		},
		selectedOperatingAssetDecimals: (state) => {
			return state.currencies[state.selectedOperatingSymbol].decimals;
		}
	},
	mutations: {
		addPair(state, data){
			Vue.set(state.subscribed_assets, data.baseToken, data)
		},
		setBestAskOdds(state, data){
			Vue.set(state.best_ask_odds_by_pair, data.pair, data.odds)
		},
		setCurrencies(state, data){
			state.currencies = data;
		},
		setIsInitialized(state, data){
			state.isInitialized = data;
		},
		setSelectedCurrency(state, data){
			state.selectedOperatingSymbol = data;
		}

	},
	actions: {
		getCurrencies(context){
			axios.get('/api/currencies').then((response) => {
				if (response.status == 200){
					context.commit('setCurrencies', response.data);
					context.commit('setIsInitialized', true);
				} else
					console.log("couldn't fetch currencies");
			});

		}
  },
  modules: {
  }
})
