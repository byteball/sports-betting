<template>
	<section>
		<div class="buttons p-1">
			<b-button 
				@click="onClick(key)" 
				:type="getColorTypeForCat(key)"
				size="is-large"
				:outlined="selectedCategorie!=key.toLowerCase()"
				v-for="(championships,key) in cats" 
				:key="'button_' +key">
				 <b-icon :icon="getIconForCat(key)"></b-icon>
					{{key}}
			</b-button>
		</div>
	</section>
</template>

<script>

const conf = require("../conf.js")
const nb_columns = 4;
import DesignHelpers from '../mixins/designHelpers'

export default {
	mixins:[DesignHelpers],
	components: {
	
	},
	props: {
		selectedCategorie: String
	},
	data() {
		return {
			conf: conf,
			rows: [],
			cats: {}
		}
	},
	computed:{

	},
	created(){
		this.axios.get('/api/categories').then((response) => {
			this.cats = response.data;
		})
	},
	watch:{

	},
	methods: {
		onClick: function(item){
			this.$router.push({ name: 'categorie', params: {
				categorie: item.toLowerCase()
				} 
			})
		},
	}
}
</script>


<style lang='scss' scoped>

</style>


