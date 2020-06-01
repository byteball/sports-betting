const testnet = true;

exports.testnet = testnet;
exports.website_name = "Sport betting";
exports.issuer_base_aa = "UPGVQBNM6YOZS5OG7QFB2O2P4UF3LQNR";
exports.oracle_address = testnet ? '4EHFJW5EY74DG6PGSXX5CHF5F2FFIJX4' : '';
exports.protocol = testnet ?"obyte-tn" : "obyte";
exports.odex_base_url = "http://localhost:3000/";
exports.gb_to_bytes = 1e9;