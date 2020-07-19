export default {
	methods: {
		getColorTypeForCat: function(category){
			if (category.toLowerCase() == 'soccer')
				return 'is-soccer';
			if (category.toLowerCase() == 'baseball')
				return 'is-baseball';
			if (category.toLowerCase() == 'ice hockey')
				return 'is-hockey';
			if (category.toLowerCase() == 'basketball')
				return 'is-basketball';
			if (category.toLowerCase() == 'american football')
				return 'is-us-football';
		},
		getIconForCat: function(category){
			if (category.toLowerCase() == 'ice hockey')
			return 'hockey-sticks';
			if (category.toLowerCase() == 'american football')
				return 'football';
			if (category.toLowerCase() == 'basketball')
				return 'basketball';
			if (category.toLowerCase() == 'baseball')
				return 'baseball';
			if (category.toLowerCase() == 'soccer')
				return 'soccer';
		},
  }
};