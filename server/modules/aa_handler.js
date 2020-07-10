const conf = require('ocore/conf.js');
const lightWallet = require('ocore/light_wallet.js');
const network = require('ocore/network.js');
const wallet_general = require('ocore/wallet_general.js');
const eventBus = require('ocore/event_bus.js');
const db = require('ocore/db.js');
const storage = require('ocore/storage.js');
const objectHash = require('ocore/object_hash.js');
const datafeeds = require('ocore/data_feeds.js');

var assocFixturesByFeedName = {};
var assocFeedNameByAaAddress = {};

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
	console.log('onTransactionsBecameStable')
	console.log(units)
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
					console.log(message);

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

function getAaAddressForFeedname(feed_name){
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
				"expiry_date": split_feedname[3]
			}
		}
	];
	var aa_address = objectHash.getChash160(parameterized_aa)
	assocFeedNameByAaAddress[aa_address] = feed_name;
	console.log(feed_name + ": " + aa_address);
	return aa_address;
}

function getTokenInfo(feed_name){
	var issuer_address = getAaAddressForFeedname(feed_name);
	if (!isIssuerDefined(feed_name) || !areAssetsIssued(feed_name))
		network.requestFromLightVendor('light/get_aa_state_vars', {
			address: issuer_address,
			var_prefix_from: "0",
			var_prefix_to: "z"
		}, function(ws, request, objResponse){
			console.log(objResponse);
			if (objResponse.error)
				return;
			updateFixtureForIssuerDefined(feed_name, issuer_address);
			updateFixtureAssets(feed_name, objResponse);

		});

	if (!isResultPosted(feed_name))
		network.requestFromLightVendor('light/get_data_feed', {
			oracles:[conf.oracle_address],
			feed_name
		}, function(ws, request, value){
			if (typeof value == 'string')
				updateFixtureForResultPosted(feed_name, value);
		});
}




function updateFixtureForIssuerDefined(feed_name, issuer_address){
	if (!assocFixturesByFeedName[feed_name])
		assocFixturesByFeedName[feed_name] = {};
	assocFixturesByFeedName[feed_name].aa_address = issuer_address;
}

function updateFixtureForResultPosted(feed_name, feed_value){
	if (!assocFixturesByFeedName[feed_name])
		assocFixturesByFeedName[feed_name] = {};
	assocFixturesByFeedName[feed_name].result = feed_value;
}

function isResultPosted(feed_name){
	return assocFixturesByFeedName[feed_name] && assocFixturesByFeedName[feed_name].result;
}

function isIssuerDefined(feed_name){
	return assocFixturesByFeedName[feed_name] && assocFixturesByFeedName[feed_name].aa_address;
}

function areAssetsIssued(feed_name){
	return assocFixturesByFeedName[feed_name] && assocFixturesByFeedName[feed_name].assets;
}

function updateFixtureAssets(feed_name, assocVars){
	if (!assocFixturesByFeedName[feed_name])
		assocFixturesByFeedName[feed_name] = {};
	if (assocVars['hometeam']){
		assocFixturesByFeedName[feed_name].assets = {
			home: assocVars['hometeam'],
			away: assocVars['awayteam'],
			draw: assocVars['draw'],
			canceled: assocVars['canceled'],
		}
	}
}

eventBus.on("message_for_light", function(ws, subject, body){

	if (subject == 'light/aa_definition'){

		body.messages.forEach(function(message){
			if (message.app == "definition"){
				var template = message.payload.definition[1];
				var params = template.params;
				if (template.base_aa == conf.issuer_base_aa){
					var templated_feed_name = params.championship + '_' + params.home_team + '_' + params.away_team + '_' + params.expiry_date; 
					updateFixtureForIssuerDefined(templated_feed_name, getAaAddressForFeedname(templated_feed_name));
				}
			}
		});
	}



	if (subject == 'light/aa_response' && assocFeedNameByAaAddress[body.aa_address]){
		network.requestFromLightVendor('light/get_aa_state_vars', {
			address: body.aa_address,
			var_prefix_from: "0",
			var_prefix_to: "z"
		}, function(ws, request, objResponse){
			if (objResponse.error)
				return;
			updateFixtureAssets(assocFeedNameByAaAddress[body.aa_address], objResponse);
		});
	}

});



exports.getTokenInfo = getTokenInfo;
exports.setAssocFixturesByFeedname = setAssocFixturesByFeedname;