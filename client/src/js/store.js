import Vue from 'vue'
import Vuex from 'vuex'


Vue.use(Vuex)

export default new Vuex.Store({
	state: {
		subscribed_assets: {},
		best_ask_odds_by_pair: {}
	},
	mutations: {
		addPair(state, data){
			Vue.set(state.subscribed_assets, data.baseToken, data)
		},
		setBestAskOdds(state, data){
			console.log(data);
			Vue.set(state.best_ask_odds_by_pair, data.pair, data.odds)
		}
	},
	actions: {
  },
  modules: {
  }
})
