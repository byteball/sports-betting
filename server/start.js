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
var assocFixturesBycategory = {};
var assocChampionshipsByCategory = {};
var assocFixturesByFeedName = {};



const app = express()

const limiter = rateLimit({
	windowMs: 5 * 60 * 1000, // 5 minutes
	max: 500 // limit each IP to 500 requests per windowMs
});

app.set('trust proxy', 1);

app.use(limiter);
app.use(expressLogging(logger));



app.get('/api/championships_by_cat/:cat', async function(request, response){
	await waitForCalendarReady();
	const cat = request.params.cat.charAt(0).toUpperCase() + request.params.cat.slice(1);
	return response.send(assocChampionshipsByCategory[cat] || []);
});

app.get('/api/fixtures_by_cat/:cat', async function(request, response){
	await waitForCalendarReady();
	const cat = request.params.cat.charAt(0).toUpperCase() + request.params.cat.slice(1);
	return response.send(assocFixturesBycategory[cat] || []);
});

app.get('/api/fixtures_by_championship/:championship', async function(request, response){
	await waitForCalendarReady();
	const championship = request.params.championship.toUpperCase() ;
	return response.send(assocFixturesByChampionship[championship] || []);
});

app.get('/api/fixtures_by_team/:team', async function(request, response){
	await waitForCalendarReady();
	const team = request.params.team;
	return response.send(assocFixturesByTeam[team] || []);
});

app.get('/api/categories', async function(request, response){
	return response.send(assocChampionshipsByCategory)
})

app.get('/api/fixtures', async function(request, response){
	return response.send(Object.values(assocFixturesByFeedName))
})

app.listen(conf.api_port);



async function start(){
	await requestCalendar();
	setInterval(requestCalendar, 60 * 60 * 1000);
}

function waitForCalendarReady(){
	return new Promise((resolve)=>{
		if (bCalendarFetched)
			return resolve();
		else
			setTimeout(()=>{
				waitForCalendarReady().then(resolve);
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
	bCalendarFetched = false;

	assocFixturesByChampionship = {};
	assocFixturesByTeam = {};
	assocFixturesBycategory = {};
	assocChampionshipsByCategory = {};
	assocFixturesByFeedName = {};
	aa_handler.setAssocFixturesByFeedname(assocFixturesByFeedName);
	const dateNow = (new Date()).toISOString();
	
	for (var cat in receivedCalendar){
		if (cat == 'creation_date')
			continue;
			console.log(cat);

		if (!assocChampionshipsByCategory[cat])
			assocChampionshipsByCategory[cat] = [];
		for (var championship in receivedCalendar[cat]){
			var fixtures = receivedCalendar[cat][championship].fixtures;
			if (!fixtures)
				continue;
			var nb_incoming_fixtures = 0;
			for (var key in fixtures)
				if (fixtures[key].date > dateNow)
					nb_incoming_fixtures++
			assocChampionshipsByCategory[cat].push({
				championship,
				nb_fixtures: Object.keys(receivedCalendar[cat][championship].fixtures).length,
				nb_incoming_fixtures
			});
			for (var feedname in receivedCalendar[cat][championship].fixtures){
				console.log(feedname);
				assocFixturesByFeedName[feedname] = receivedCalendar[cat][championship].fixtures[feedname];
				
				var fixture = assocFixturesByFeedName[feedname];
				fixture.championship = championship;
				aa_handler.getTokenInfo(feedname);

				if (!assocFixturesBycategory[cat])
					assocFixturesBycategory[cat] = [];
				assocFixturesBycategory[cat].push(fixture);

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
