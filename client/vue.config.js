module.exports = {
	devServer: {
		proxy: {
			"^/api" : { 
				target: process.env.VUE_APP_TESTNET ? 'http://127.0.0.1:1860/' : 'http://127.0.0.1:1861/'
			}
		}
	},
	configureWebpack: {

	},
	pluginOptions: {
		i18n: {
			locale: 'en',
			fallbackLocale: 'en',
			localeDir: 'locales',
			enableInSFC: false
		}
	}
}
