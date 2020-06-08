export default {
	methods: {
		getColorTypeForCat: function(categorie){
			if (categorie.toLowerCase() == 'soccer')
				return 'is-soccer';
			if (categorie.toLowerCase() == 'baseball')
				return 'is-baseball';
			if (categorie.toLowerCase() == 'ice hockey')
				return 'is-hockey';
			if (categorie.toLowerCase() == 'basketball')
				return 'is-basketball';
			if (categorie.toLowerCase() == 'american football')
				return 'is-us-football';
		},
		getIconForCat: function(categorie){
			if (categorie.toLowerCase() == 'ice hockey')
			return 'hockey-sticks';
			if (categorie.toLowerCase() == 'american football')
				return 'football';
			if (categorie.toLowerCase() == 'basketball')
				return 'basketball';
			if (categorie.toLowerCase() == 'baseball')
				return 'baseball';
			if (categorie.toLowerCase() == 'soccer')
				return 'soccer';
		},
  }
};