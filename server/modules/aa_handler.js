const conf = require('ocore/conf.js');
const lightWallet = require('ocore/light_wallet.js');
const myWitnesses = require('ocore/my_witnesses.js');
const network = require('ocore/network.js');
const wallet_general = require('ocore/wallet_general.js');
const eventBus = require('ocore/event_bus.js');
const db = require('ocore/db.js');
const storage = require('ocore/storage.js');
const aa_composer = require('ocore/aa_composer.js');
const objectHash = require('ocore/object_hash.js');
const moment = require('moment');

var assocFixturesByFeedName = {};
var assocFeedNameByAaAddress = {};

function setAssocFixturesByFeedname(_assocFixturesByFeedName){
	assocFixturesByFeedName = assocFixturesByFeedName;
}

myWitnesses.readMyWitnesses(function (arrWitnesses) {
	if (arrWitnesses.length > 0)
		return start();
	myWitnesses.insertWitnesses(conf.initial_witnesses, start);
}, 'ignore');

eventBus.on('connected', function(){
	network.addLightWatchedAa(conf.base_aa);
});

function start(){
	lightWallet.setLightVendorHost(conf.hub);

	wallet_general.addWatchedAddress(conf.counterstake_aa_address, function(error){
		if (error)
			console.log(error)
		else
			console.log(conf.counterstake_aa_address + " added as watched address")

		refresh();

		setInterval(refresh, 60 * 1000);
		eventBus.on('new_my_transactions', treatUnconfirmedEvents);
		eventBus.on('my_transactions_became_stable', discardUnconfirmedEventsAndUpdate);
		eventBus.on('sequence_became_bad', discardUnconfirmedEventsAndUpdate);

	});
}

function getAaAddressForFeedname(feed_name){
	var split_feedname = feed_name.split('_');
	var parameterized_aa = [
		"autonomous agent",
		{
			"base_aa": conf.issuer_base_aa,
			"params": {
					"oracle_address": conf.oracle_address,
					"championship": split_feedname[0],
					"home_team": split_feedname[1],
					"away_team": split_feedname[2],
					"expiry_date": split_feedname[3]
			}
		}
	];
	var aa_address = objectHash.getChash160(parameterized_aa)
	assocFeedNameByAaAddress[aa_address] = feed_name;
	return aa_address;
}

function watchFeedName(feed_name){

	return Promise(function(resolve){
	var issuer_address = getAaAddressForFeedname(feed_name);

		network.requestFromLightVendor('light/get_aa_state_vars', {
			address: issuer_address,
			var_prefix_from: "0",
			var_prefix_to: "z"
		}, function(ws, request, objResponse){
			if (!assocFixturesByFeedName[feed_name].token_info)
				assocFixturesByFeedName[feed_name].token_info = {};
			console.log(objResponse);
			if (objResponse.error)
				return resolve();
			assocFixturesByFeedName[feed_name].token_info.is_option_aa_defined = true;

		})
	});

}

eventBus.on("message_for_light", function(ws, subject, body){

	if (subject == 'light/aa_definition'){

		body.messages.forEach(function(message){
			if (message.app == "definition"){
				var template = message.payload.definition[1];
				var params = template.params;
				if (template.base_aa == conf.issuer_base_aa){
					var templated_feed_name = params.championship + '_' + params.home_team + '_' + params.away_team + '_' + params.expiry_date; 
					if (assocFixturesByFeedName[templated_feed_name]){
						if (!assocFixturesByFeedName[feed_name].token_info)
							assocFixturesByFeedName[feed_name].token_info = {};
						assocAllQuestions[params.feed_name].is_option_aa_defined = true;
					}
				}
			}
		});
	}

	if(subject == 'light/aa_response'){
		if (body.aa_address == conf.token_registry_aa_address)
			return checkRegistrar();
		if (assocQuestionIdsByOptionAas[body.aa_address]){
			return checkOptionAaStatusForQuestions([assocQuestionIdsByOptionAas[body.aa_address]], ()=>{});
		}
	}

});



exports.watchFeedName = watchFeedName;
exports.setAssocFixturesByFeedname = setAssocFixturesByFeedname;