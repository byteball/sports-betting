'use strict';
const conf = require('ocore/conf.js');
const correspondents = require('./modules/correspondents.js');
const eventBus = require('ocore/event_bus.js');
const headlessWallet = require('headless-obyte');
const express = require('express')
const rateLimit = require("express-rate-limit");
const expressLogging = require('express-logging');
const logger = require('logops');
const aa_handler = require("./modules/aa_handler.js");

const CALENDAR_REQUEST_TIMEOUT = 30; // in seconds

var oracle_device_address;
var bRequestingCalendar = false;
var bCalendarFetched = false;

var assocFixturesByChampionship = {};
var assocFixturesByTeam = {};
var assocFixturesByCategorie = {};
var assocChampionshipsByCategorie = {};
var assocFixturesByFeedname = {};


aa_handler.setAssocFixturesByFeedname(assocFixturesByFeedname);

const app = express()

const limiter = rateLimit({
	windowMs: 5 * 60 * 1000, // 5 minutes
	max: 500 // limit each IP to 500 requests per windowMs
});

app.set('trust proxy', 1);

app.use(limiter);
app.use(expressLogging(logger));



app.get('/api/championships_by_cat/:cat', async function(request, response){
	await waitForCalendar();
	const cat = request.params.cat;
	return response.send(assocChampionshipsByCategorie[cat] || []);
});

app.get('/api/fixtures_by_championship/:championship', async function(request, response){
	await waitForCalendar();
	const championship = request.params.championship;
	return response.send(assocFixturesByChampionship[championship] || []);
});

app.get('/api/fixtures_by_team/:team', async function(request, response){
	await waitForCalendar();
	const team = request.params.team;
	return response.send(assocFixturesByTeam[team] || []);
});

app.listen(conf.api_port);



async function start(){
	await requestCalendar();
}

function waitForCalendar(){
	return Promise(function(resolve){
		if (bCalendarFetched)
			return resolve();
		else
			setTimeout(function(){
				waitForCalendar.then(resolve);
			}, 500);

	})
}


async function requestCalendar(){
	return new Promise ((resolve)=>{
		if (bRequestingCalendar){
			console.log("already requesting calendar");
			return resolve();
		}
		bRequestingCalendar = true;

		function sendRequest(){
			var device = require('ocore/device.js');
			device.sendMessageToDevice(oracle_device_address, 'object', {
				time_limit: new Date() / 1000 + CALENDAR_REQUEST_TIMEOUT,
				action: 'get_calendar'
			})
		}

		function onCalendarReceived(from_address, receivedCalendar){
			if (from_address != oracle_device_address)
				return console.error("object received from unknown peer");
			fetchCalendar(receivedCalendar);
			eventBus.removeListener('object', onCalendarReceived);
			bRequestingCalendar = false;
			clearInterval(interval_id);
			return resolve();
		}

		eventBus.on('object', onCalendarReceived);
		sendRequest();
		var interval_id = setInterval(sendRequest, CALENDAR_REQUEST_TIMEOUT * 1000)

	});
}

function fetchCalendar(receivedCalendar){
	bCalendarFetched =false;
	for (var cat in receivedCalendar){
		if (cat == 'creation_date')
			continue;

		if (!assocChampionshipsByCategorie[cat])
			assocChampionshipsByCategorie[cat] = [];
		for (var championship in receivedCalendar[cat]){
			assocChampionshipsByCategorie.push(championship);
			for (var feedname in receivedCalendar[cat][championship].fixtures){
				if (assocFixturesByFeedname[feedname])
					Object.assign(assocFixturesByFeedname[feedname], receivedCalendar[cat][championship].fixtures[feedname])
				else {
				
					assocFixturesByFeedname[feedname] = receivedCalendar[cat][championship].fixtures[feedname];
				}
				var fixture = assocFixturesByFeedname[feedname] ;


				if (!assocFixturesByCategorie[cat])
					assocFixturesByCategorie[cat] = [];
				assocFixturesByCategorie[cat].push(fixture);

				if (!assocFixturesByChampionship[championship])
					assocFixturesByChampionship[championship] = [];
				assocFixturesByChampionship[championship].push(fixture);

				if (!assocFixturesByTeam[championship + '_' + fixture.feedHomeTeamName])
					assocFixturesByTeam[championship + '_' + fixture.feedHomeTeamName] = [];
				assocFixturesByTeam[championship + '_' + fixture.feedHomeTeamName].push(fixture);
				
				if (!assocFixturesByTeam[championship + '_' + fixture.feedAwayTeamName])
					assocFixturesByTeam[championship + '_' + fixture.feedAwayTeamName] = [];
				assocFixturesByTeam[championship + '_' + fixture.feedAwayTeamName].push(fixture);
			}
		}
	}
	bCalendarFetched = true;
}

eventBus.on('headless_wallet_ready', function() {
	correspondents.findCorrespondentByPairingCode(conf.oracle_pairing_code, (correspondent) => {
		if (!correspondent) {
			correspondents.addCorrespondent(conf.oracle_pairing_code, 'Sport Oracle', (err, device_address) => {
				if (err)
					throw new Error(err);
				oracle_device_address = device_address;
				start();
			});
		} else {
			oracle_device_address = correspondent.device_address;
			start();
		}
	});

});
