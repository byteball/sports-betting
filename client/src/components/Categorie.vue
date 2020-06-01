<template>
	<section>
		<div>
		<div class="field">
				<b-switch
				v-for="(value,key) in assocAllFilters" 
				type="is-primary"
				v-model="assocSelectedFilters[key]"
					@input="filterFixturesAndCreateRows"
					:key="'button_'+key"
					>{{key}}</b-switch>
			</div>
		</div>
		<div class="tile is-ancestor" v-for="(row,row_index) in fixtures_rows" :key="'row_' +row_index">
			<fixture :fixture="fixture"  v-for="(fixture,fixture_index) in row" :key="'row_' +fixture_index"/>
		</div>
	</section>
</template>
<script>

const conf = require("../conf.js")
const nb_columns = 4;
import Fixture from './Fixture.vue'
import Vue from 'vue'

export default {
	components: {
		Fixture
	},
	props: {
		categorie: String
	},
	data() {
		return {
			conf: conf,
			fixtures_rows: [],
			all_fixtures_from_cat: [],
			assocAllFilters: {},
			assocSelectedFilters: {},
		}
	},

	created(){
		this.axios.get('/api/fixtures_by_cat/'+this.categorie).then((response) => {
			this.all_fixtures_from_cat = response.data
			this.initializeFilters();
			this.filterFixturesAndCreateRows();		
		})
	},

	watch:{

	},
	methods: {

		initializeFilters(){
			this.assocAllFilters = {};
			const fixtures = this.all_fixtures_from_cat;
			for (var i=0; i < fixtures.length; i++){
				this.assocAllFilters[fixtures[i].championship]=true;
			}
				this.assocSelectedFilters = {...this.assocAllFilters};
		},
		filterFixturesAndCreateRows(){
			console.log('filterFixturesAndCreateRows');
			const fixtures = this.all_fixtures_from_cat;
			let row_index = 0;
			let fixture_index = 0;
			const rows = [];
			rows[row_index] = [];
			for (var i=0; i < fixtures.length ; i++){
				if (this.assocSelectedFilters && !this.assocSelectedFilters[fixtures[i].championship])
					continue;
				if (!(fixture_index % nb_columns)){
					row_index++;
					rows[row_index] = [];
				}
				rows[row_index].push(fixtures[i]);
				fixture_index++;
			}
			this.fixtures_rows = rows;

		}
	}
}
</script>


<style lang='scss' scoped>
</style>


