const testnet = !!process.env.VUE_APP_TESTNET;

exports.testnet = testnet;
exports.website_name = testnet ? "Sport betting testnet" : "Sport betting";
exports.issuer_base_aa = "ZZEVOHYFMAR4GOVTD4ZFZOAAHBJS5ZIY";
exports.oracle_address = testnet ? '4EHFJW5EY74DG6PGSXX5CHF5F2FFIJX4' : 'TKT4UESIKTTRALRRLWS4SENSTJX6ODCW';
exports.protocol = testnet ?"obyte-tn" : "obyte";
exports.odex_base_url = testnet ? "http://testnet.odex.ooo/" : "http://odex.ooo/";
exports.currency_decimals = 4;
exports.currency_symbol = "OUSD";
exports.create_market_byte_amount = 20000;
exports.odex_ws_url = testnet ? "wss://testnet.odex.ooo/socket" : "wss://odex.ooo/socket";
exports.defaultCurrency = testnet ? "USDC" : "OUSD";