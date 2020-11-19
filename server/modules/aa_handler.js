const conf = require('ocore/conf.js');
const lightWallet = require('ocore/light_wallet.js');
const network = require('ocore/network.js');
const wallet_general = require('ocore/wallet_general.js');
const eventBus = require('ocore/event_bus.js');
const db = require('ocore/db.js');
const storage = require('ocore/storage.js');
const objectHash = require('ocore/object_hash.js');

var assocFixturesByFeedName = {};
var assocFeedNameAndCurrencyByAaAddress = {};

function setAssocFixturesByFeedname(_assocFixturesByFeedName){
	assocFixturesByFeedName = _assocFixturesByFeedName;
}


eventBus.on('headless_wallet_ready', function(){
	network.addLightWatchedAa(conf.issuer_base_aa);

	wallet_general.addWatchedAddress(conf.oracle_address, function(error){
		if (error)
			console.log(error)
		else
			console.log(conf.oracle_address + " added as watched address")

		refresh();
		setInterval(refresh, 60 * 1000);
		eventBus.on('my_transactions_became_stable', onTransactionsBecameStable);

	});
});

function refresh(){
	lightWallet.refreshLightClientHistory();
}

function onTransactionsBecameStable(units){
	units.forEach(function(unit){
		storage.readJoint(db, unit, {
			ifNotFound: function(){
				throw Error("bad unit not found: "+unit);
			},
			ifFound: function(objJoint){
				var objUnit = objJoint.unit;
				console.log(objUnit)
				if (objUnit.authors[0].address != conf.oracle_address)
					return;
				objUnit.messages.forEach(function(message){
					if (message.app =='data_feed'){
						for (var key in message.payload){
							updateFixtureForResultPosted(key, message.payload[key])
						}
					}
				})
			}
		})
	});
}

function getAaAddressForFeednameAndCurrency(feed_name, currency){
	var split_feedname = feed_name.split('_');
	var parameterized_aa = [
		"autonomous agent",
		{
			"base_aa": conf.issuer_base_aa,
			"params": {
				"oracle": conf.oracle_address,
				"championship": split_feedname[0],
				"home_team": split_feedname[1],
				"away_team": split_feedname[2],
				"fixture_date": split_feedname[3],
				"reserve_asset": currency
			}
		}
	];
	var aa_address = objectHash.getChash160(parameterized_aa)
	assocFeedNameAndCurrencyByAaAddress[aa_address] = {feed_name, currency};
	return aa_address;
}

function watchTokens(feed_name){
	conf.currencies.forEach(function(currency){
		const issuer_address = getAaAddressForFeednameAndCurrency(feed_name, currency);
		wallet_general.addWatchedAddress(issuer_address, function(error){
			if (error)
				console.log(error)
			else
				console.log(issuer_address + " added as watched address")
		});

		if (!isIssuerDefined(feed_name, currency) || !areAssetsIssued(feed_name, currency))
			network.requestFromLightVendor('light/get_aa_state_vars', {
				address: issuer_address,
				var_prefix_from: "0",
				var_prefix_to: "z"
			}, function(ws, request, objResponse){
				console.log(objResponse);
				if (objResponse.error)
					return;
				updateFixtureForIssuerDefined(feed_name, currency, issuer_address);
				updateFixtureAssets(feed_name, currency, objResponse);

			});

		if (!isResultPosted(feed_name))
			network.requestFromLightVendor('light/get_data_feed', {
				oracles:[conf.oracle_address],
				feed_name
			}, function(ws, request, value){
				if (typeof value == 'string')
					updateFixtureForResultPosted(feed_name, value);
			});
	})
}




function updateFixtureForIssuerDefined(feed_name, currency, issuer_address){
	createFeedNameEntryIfNotExists(feed_name);
	if (!assocFixturesByFeedName[feed_name].currencies[currency])
		assocFixturesByFeedName[feed_name].currencies[currency] = {};	
	assocFixturesByFeedName[feed_name].currencies[currency].aa_address = issuer_address;
}

function updateFixtureForResultPosted(feed_name, feed_value){
	createFeedNameEntryIfNotExists(feed_name);
	assocFixturesByFeedName[feed_name].result = feed_value;
}

function isResultPosted(feed_name){
	return assocFixturesByFeedName[feed_name] && assocFixturesByFeedName[feed_name].result;
}

function isIssuerDefined(feed_name, currency){
	return assocFixturesByFeedName[feed_name] && assocFixturesByFeedName[feed_name].currencies && assocFixturesByFeedName[feed_name].currencies[currency]
	 && assocFixturesByFeedName[feed_name].currencies[currency].aa_address;
}

function areAssetsIssued(feed_name, currency){
	return assocFixturesByFeedName[feed_name] && assocFixturesByFeedName[feed_name].currencies && assocFixturesByFeedName[feed_name].currencies[currency]
	 && assocFixturesByFeedName[feed_name].currencies[currency].assets;
}

function updateFixtureAssets(feed_name, currency, assocVars){
	createFeedNameEntryIfNotExists(feed_name);
	if (!assocFixturesByFeedName[feed_name].currencies[currency])
		assocFixturesByFeedName[feed_name].currencies[currency] = {};
	if (assocVars['hometeam']){
		assocFixturesByFeedName[feed_name].currencies[currency].assets = {
			home: assocVars['hometeam'],
			away: assocVars['awayteam'],
			draw: assocVars['draw'],
			canceled: assocVars['canceled'],
		}
	}
}

function createFeedNameEntryIfNotExists(feed_name){
	if (!assocFixturesByFeedName[feed_name])
		assocFixturesByFeedName[feed_name] = {};
	if (!assocFixturesByFeedName[feed_name].currencies)
		assocFixturesByFeedName[feed_name].currencies = {};
}

eventBus.on("message_for_light", function(ws, subject, body){

	if (subject == 'light/aa_definition'){

		body.messages.forEach(function(message){
			if (message.app == "definition"){
				const template = message.payload.definition[1];
				const params = template.params;
				if (template.base_aa == conf.issuer_base_aa){
					const templated_feed_name = params.championship + '_' + params.home_team + '_' + params.away_team + '_' + params.fixture_date; 
					const currency = params.reserve_asset;
					updateFixtureForIssuerDefined(templated_feed_name, currency, getAaAddressForFeednameAndCurrency(templated_feed_name, currency));
				}
			}
		});
	}
});



eventBus.on('aa_response', function(objAaResponse){
	if (!assocFeedNameAndCurrencyByAaAddress[objAaResponse.aa_address])
		return console.log("feedname not in calendar anymore");
	network.requestFromLightVendor('light/get_aa_state_vars', {
		address: objAaResponse.aa_address,
		var_prefix_from: "0",
		var_prefix_to: "z"
	}, function(ws, request, objStateVarsResponse){
		if (objStateVarsResponse.error)
			return;
		updateFixtureForIssuerDefined(assocFeedNameAndCurrencyByAaAddress[objAaResponse.aa_address].feed_name, assocFeedNameAndCurrencyByAaAddress[objAaResponse.aa_address].currency, objAaResponse.aa_address);
		updateFixtureAssets(assocFeedNameAndCurrencyByAaAddress[objAaResponse.aa_address].feed_name, assocFeedNameAndCurrencyByAaAddress[objAaResponse.aa_address].currency, objStateVarsResponse);
	});
});



exports.watchTokens = watchTokens;
exports.setAssocFixturesByFeedname = setAssocFixturesByFeedname;