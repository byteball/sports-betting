<template>
	<section>
		<title-bar>
			<category-selector class="column" :selectedcategory="category" />
		</title-bar>
		<div class="columns">
			<div class="column"/>
			<div class="column is-two-thirds" >
				<div style="height:100%;">
				</div>
				<div class="field" style="margin-top:2rem;" >
					<b-switch
						v-for="(value,key) in assocAllFilters" 
						v-model="assocSelectedFilters[key]"
						@input="filterFixturesAndCreateRows"
						:key="'button_'+key"
						size="is-small"
					>
					{{$t(key)}}
					</b-switch>
				</div>
			</div>
		</div>
		<b-tabs>
			<b-tab-item icon="calendar-month" :label="$t('upcoming')">
				<b-loading :active.sync="isLoading"/>
				<div v-if="upcoming_fixtures_rows[0]&&upcoming_fixtures_rows[0].length>0">
					<div  class="tile is-ancestor" v-for="(row,row_index) in upcoming_fixtures_rows" :key="'row_' +row_index">
						<fixture :fixture="fixture"  :comingFixture="true" v-for="(fixture,fixture_index) in row"  :type="getColorTypeForCat(category)" :key="'row_' +fixture_index"/>
					</div>
				</div>
				<div v-else>
					{{$t('noUpcomingFixtures')}}
				</div>
			
			</b-tab-item>
			<b-tab-item icon="calendar-check" :label="$t('finished')">
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
import Vue from 'vue'
import TilesHelpers from '../mixins/tilesHelpers'
import DesignHelpers from '../mixins/designHelpers'

export default {
	mixins:[TilesHelpers,DesignHelpers],
	components: {
		Fixture,
		categorySelector,
		titleBar
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
		this.getFixturesForCatgorie()
	},

	watch:{
		category: function(){
			this.getFixturesForCatgorie();
		}
	},
	methods: {

		getFixturesForCatgorie(){
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
			const upcomingFixtures = allFixtures.filter((fixture)=>{
				if (dateNow > fixture.date)
					return false;
				if (this.isNoFilterSelected() || this.assocSelectedFilters[fixture.championship])
					return true;
				return false;
			}).sort((a,b)=>{
				if(a.date > b.date)
					return 1;
				else
					return -1;
			});
			const finishedFixtures = allFixtures.filter((fixture)=>{
				if (dateNow <= fixture.date)
					return false;
				if (this.isNoFilterSelected() || this.assocSelectedFilters[fixture.championship])
					return true;
				return false;
			}).sort((a,b)=>{
				if(a.date < b.date)
					return 1;
				else
					return -1;
			});
			this.upcoming_fixtures_rows= this.placeInRows(upcomingFixtures, nb_columns);
			this.finished_fixtures_rows= this.placeInRows(finishedFixtures, nb_columns);
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


