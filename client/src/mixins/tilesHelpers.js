export default {
	methods: {
		placeInRows(elements, nb_columns){
			let row_index = 0;
			let element_index = 0;
			const rows = [];

			if (Array.isArray(elements)){
				rows[row_index] = [];
				for (var i=0; i < elements.length ; i++){
					if (i!=0 && !(i % nb_columns)){
						row_index++;
						rows[row_index] = [];
					}
					rows[row_index].push(elements[i]);
				}
			} else {
				rows[row_index] = {};
				for (var key in elements){
					if (element_index!=0 &&!(element_index % nb_columns)){
						row_index++;
						rows[row_index] = {};
					}
					rows[row_index][key] = elements[key];
					element_index++;
				}
			}
			return rows;
		},
  }
};