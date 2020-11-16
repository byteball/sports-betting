<template>
	<section>
		<title-bar>
			<currency-selector class="column"  />
		</title-bar>
		<div class="columns">
			<category-selector v-if="$store.state.isInitialized" class="column" :selectedcategory="category" />
		</div>
		<b-tabs v-if="$store.state.isInitialized">
			<b-tab-item icon="calendar-month" :label="$t('upcoming')">
				<b-loading :active.sync="isLoading"/>
					<championship-selector :filters="assocAllFilters" v-model="assocSelectedFilters" @input="filterFixturesAndCreateRows" />
				<div v-if="upcoming_fixtures_rows[0] && upcoming_fixtures_rows[0].length > 0">
					<div  class="tile is-ancestor" v-for="(row,row_index) in upcoming_fixtures_rows" :key="'row_' +row_index">
						<fixture :fixture="fixture"  :comingFixture="true" v-for="(fixture,fixture_index) in row"  :type="getColorTypeForCat(category)" :key="'row_' +fixture_index"/>
					</div>
				</div>
				<div v-else>
					{{$t('noUpcomingFixtures')}}
				</div>
			
			</b-tab-item>
			<b-tab-item icon="calendar-check" :label="$t('finished')">
							<championship-selector :filters="assocAllFilters" v-model="assocSelectedFilters" @input="filterFixturesAndCreateRows" />

				<div v-if="finished_fixtures_rows[0]&&finished_fixtures_rows[0].length>0">
					<div class="tile is-ancestor" v-for="(row,row_index) in finished_fixtures_rows" :key="'row_' +row_index">
						<fixture :fixture="fixture"  v-for="(fixture,fixture_index) in row" :type="getColorTypeForCat(category)" :key="'row_' +fixture_index"/>
					</div>
				</div>
				<div v-else>
					{{$t('noFinishedFixtures')}}
				</div>
			</b-tab-item>
		</b-tabs>
	</section>
</template>
<script>

const conf = require("../js/conf.js")
const nb_columns = 4;
import Fixture from './Fixture.vue'
import titleBar from './commons/TitleBar.vue'
import categorySelector from './CategorySelector.vue'
import championshipSelector from './ChampionshipSelector.vue'
import currencySelector from './CurrencySelector.vue'

import Vue from 'vue'
import TilesHelpers from '../mixins/tilesHelpers'
import DesignHelpers from '../mixins/designHelpers'

export default {
	mixins:[TilesHelpers,DesignHelpers],
	components: {
		Fixture,
		categorySelector,
		titleBar,
		championshipSelector,
		currencySelector
	},
	props: {
		category: String
	},
	data() {
		return {
			conf: conf,
			upcoming_fixtures_rows: [],
			finished_fixtures_rows: [],
			all_fixtures_from_cat: [],
			assocAllFilters: {},
			assocSelectedFilters: {},
			isLoading: true
		}
	},
	created(){
		this.getFixturesForCategorie()
	},

	watch:{
		category: function(){
			this.getFixturesForCategorie();
		}
	},
	methods: {

		getFixturesForCategorie(){
			this.isLoading = true;
			this.axios.get('/api/fixtures_by_cat/'+this.category).then((response) => {
				this.all_fixtures_from_cat = response.data
				this.initializeFilters();
				this.filterFixturesAndCreateRows();
				this.isLoading = false
			})

		},
		initializeFilters(){
			this.assocAllFilters = {};
			const fixtures = this.all_fixtures_from_cat;
			for (var i=0; i < fixtures.length; i++){
				this.assocAllFilters[fixtures[i].championship]=false;
			}
			this.assocSelectedFilters = {...this.assocAllFilters};
		},
		filterFixturesAndCreateRows(){
			const allFixtures = this.all_fixtures_from_cat;
			const dateNow = (new Date()).toISOString();
			const upcomingFixtures = allFixtures.filter(this.filterBySelected).filter((fixture)=>{
				if (dateNow > fixture.date)
					return false;
				return true;
			}).sort((a,b)=>{
				if(a.date > b.date)
					return 1;
				else
					return -1;
			});
			const finishedFixtures = allFixtures.filter(this.filterBySelected).filter((fixture)=>{
				if (dateNow <= fixture.date)
					return false;
				return true;
			}).sort((a,b)=>{
				if(a.date < b.date)
					return 1;
				else
					return -1;
			});
			this.upcoming_fixtures_rows= this.placeInRows(upcomingFixtures, nb_columns);
			this.finished_fixtures_rows= this.placeInRows(finishedFixtures, nb_columns);
		},
		filterBySelected(fixture){
			if (this.isNoFilterSelected() || this.assocSelectedFilters[fixture.championship])
				return true;
			return false;
		},
		isNoFilterSelected(){
			for (var key in this.assocSelectedFilters){
				if(this.assocSelectedFilters[key])
					return false;
			}
			return true;
		}

	}
}
</script>


<style lang='scss' scoped>
</style>


