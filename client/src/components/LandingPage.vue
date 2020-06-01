<template>

		<section>
 <div class="tile is-ancestor" v-for="(row,index) in rows" :key="'row_' +index">
	<div class="tile is-3 is-parent" v-for="(championships,key) in row" :key="'tile_' +key">
			<router-link :to="'/categorie/'+ key.toLowerCase()">
		<article class="tile is-child notification is-info">
			<p class="title is-5">{{key}}</p>
			<ul>
				<li v-for="championship in championships" :key="championship">
					{{ championship.championship }} - {{championship.nb_fixtures}} matches
				</li>
			</ul>
		</article>
		</router-link>
	</div>
	</div>
		</section>

</template>

<script>

const conf = require("../conf.js")
const nb_columns = 4;

export default {
	components: {
	
	},
	props: {

	},
	data() {
		return {
			conf: conf,
			rows: []
		}
	},

	created(){
		this.axios.get('/api/categories').then((response) => {
			const cats = response.data;
			let cat_index = 1;
			let row_index = 0;
			console.log(cats);
			const rows = [];
			rows[row_index] = {};
			for (var key in cats){
				if (!(cat_index % nb_columns)){
					row_index++;
					rows[row_index] = {};
				}
				rows[row_index][key] = cats[key];
				cat_index++;
			}
			this.rows = rows;
			console.log(this.rows);
		})
	},
	watch:{

	},
	methods: {
	
	}
}
</script>


<style lang='scss' scoped>

</style>


