const testnet = !!process.env.VUE_APP_TESTNET;

exports.testnet = testnet;
exports.website_name = testnet ? "Sport betting testnet" : "Sport betting";
exports.issuer_base_aa = "K6KIVWTU5C4JPSIQF5F42XYIQIIBHOIP";
exports.oracle_address = testnet ? '4EHFJW5EY74DG6PGSXX5CHF5F2FFIJX4' : 'TKT4UESIKTTRALRRLWS4SENSTJX6ODCW';
exports.protocol = testnet ?"obyte-tn" : "obyte";
exports.odex_base_url = testnet ? "http://testnet.odex.ooo/" : "http://odex.ooo/";
exports.gb_to_bytes = 1e9;
exports.odex_ws_url = testnet ? "wss://testnet.odex.ooo/socket" : "wss://odex.ooo/socket";