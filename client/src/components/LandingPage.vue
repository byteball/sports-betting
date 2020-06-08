<template>
	<section>
		<title-bar>
		</title-bar>
		<div class="tile is-ancestor" v-for="(row,index) in rows" :key="'row_' +index">
			<div class="tile is-3 is-parent" v-for="(championships,key) in row" :key="'tile_' +key">
					<router-link :to="'/categorie/'+ key.toLowerCase()">
				<article :class="getArticleClass(key)">
					<p class="title is-5">
						<b-icon :icon="getIconForCat(key)"></b-icon>
						{{key}}
					</p>
					<table >
						<tr>
							<th>League</th><th style="text-align:center;">{{$t('upcomingEvents')}}</th>
						</tr>
						<tr v-for="championship in championships" :key="championship.championship">
							<th style="min-width:150px;">{{ $t(championship.championship) }}</th>
							<th style="text-align:center;"><b-tag style="width:30px;" rounded> {{championship.nb_incoming_fixtures}} </b-tag></th>
						</tr>
					</table>
				</article>
				</router-link>
			</div>
		</div>
	</section>
</template>

<script>

const conf = require("../conf.js")
const nb_columns = 4;
import TitleBar from './commons/TitleBar.vue'
import DesignHelpers from '../mixins/designHelpers'
import TilesHelpers from '../mixins/tilesHelpers'

export default {
	mixins:[DesignHelpers, TilesHelpers],
	components: {
		TitleBar
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
			this.rows = this.placeInRows(response.data, nb_columns);
		});
	},
	computed:{

	},
	watch:{

	},
	methods: {
		getArticleClass (cat){
			return "tile is-child notification " + this.getColorTypeForCat(cat);
		}
	}
}
</script>


<style lang='scss' scoped>

</style>


