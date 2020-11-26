const EventEmitter = require('events').EventEmitter;
const WebSocket = window.WebSocket;
const conf = require('./conf.js');



class WsEmitter extends EventEmitter {

	constructor() {
		super();
		this.ws = null;
	}

	setStore(store){
		this.store = store;
	}

	connect(onDone) {

		let self = this;
		if (!onDone)
			return new Promise(resolve => this.connect(resolve));

		if (self.ws) {
			if (self.ws.readyState === self.ws.OPEN) {
				console.log("odex ws already connected");
				return onDone();
			}
			if (!self.ws.done) {
				console.log("odex ws already connecting");
				self.once('done', onDone);
				return;
			}
			console.log("odex closing, will reopen");
		}
		console.log("will connect ws to " + conf.odex_ws_url );
		self.shouldClose = false;

		self.ws = new WebSocket(conf.odex_ws_url);

		self.ws.done = false;
		function finishConnection(_ws, err) {
			if (_ws && !_ws.done) {
				_ws.done = true;
				onDone(err);
				self.emit('done', err);
			}
		}

		let abandoned = false;
		let timeout = setTimeout(function () {
			abandoned = true;
			console.log("odex ws abandonned");
			finishConnection(self.ws, 'timeout');
			self.ws = null;
		}, 5000);

		self.ws.onopen = function onWsOpen() {
			console.log('odex ws opened');
			if (!self.ws || abandoned) {
				console.log("abandoned connection opened, will close");
				this.close();
				return;
			}
			clearTimeout(timeout);

			self.ws.last_ts = Date.now();
			console.log('connected');
			finishConnection(this);
			self.emit('connected');
		};

		self.ws.onclose = function onWsClose() {
			console.log('odex ws closed');
			clearTimeout(timeout);
			self.ws = null;
			if (self.shouldClose)
				return;
			setTimeout(self.connect.bind(self), 1000);
			finishConnection(this, 'closed');
			self.once('connected',()=>{

				console.log('subscribe after reconnection');
				for (var key in self.store.state.subscribed_assets){
					self.subscribeOrderbook(
						self.store.state.subscribed_assets[key].baseToken,
						self.store.state.subscribed_assets[key].quoteToken,
						self.store.state.subscribed_assets[key].pairName
					)
				}

			});
		};

		self.ws.onerror = function onWsError(e) {
			console.log("on error from Odex WS server");
		};

		self.ws.onmessage = function (message) { // 'this' is set to ws
			self.onWebsocketMessage(this, message);
		};
	}


	onWebsocketMessage(_ws, message) {
		if (_ws.readyState !== _ws.OPEN)
			return console.log("received a message on ODEX socket with ready state " + _ws.readyState);
		_ws.last_ts = Date.now();
		
		try {
			var objMessage = JSON.parse(message.data);
			var type = objMessage.event.type;
			var payload = objMessage.event.payload;
		}
		catch(e){
			return console.log('failed to json.parse message '+message);
		}
		
		let channel = objMessage.channel;

		if (!this.orderbook)
			this.orderbook= {};
		if (channel === 'orderbook' && type === 'INIT'){
			if (!this.orderbook[payload.pairName])
			this.orderbook[payload.pairName] = {};
			this.orderbook[payload.pairName].asks = payload.asks;
			if (payload.asks[0])
				this.store.commit('setBestAskOdds', {pair: payload.pairName , odds: payload.asks[0].price})
		}

		if (channel === 'orderbook' && type === 'UPDATE'){
			var self = this;
			payload.asks.forEach(function(updated_ask){
				if (updated_ask.amount === 0){
					self.orderbook[payload.pairName].asks = self.orderbook[payload.pairName].asks.filter(function(ask){
						return ask.price !== updated_ask.price;
					})
				} else {
					let index = self.orderbook[payload.pairName].asks.findIndex(function(ask){
						return ask.price === updated_ask.price;
					})
					if (index > -1)
						self.orderbook[payload.pairName].asks[index] = updated_ask;
					else
						self.orderbook[payload.pairName].asks.push(updated_ask);
				}
			});
			self.orderbook[payload.pairName].asks.sort((a,b)=>{a.price - b.price});

			if (self.orderbook[payload.pairName].asks[0])
				self.store.commit('setBestAskOdds', {pair: payload.pairName , odds: self.orderbook[payload.pairName].asks[0].price})
			else
				self.store.commit('setBestAskOdds', {pair: payload.pairName , odds: 0})
		}

	}

	isConnected() {
		return (this.ws && this.ws.readyState === this.ws.OPEN);
	}

	close() {
		this.shouldClose = true;
		if (this.ws)
			this.ws.close();
	}

	send(message) {
		return new Promise(async (resolve)=>{
			let ws = this.ws;
			if (!ws || ws.readyState !== ws.OPEN) {
				let err = await this.connect();
				if (err)
					return resolve(err);
				ws = this.ws;
			}

			if (!ws)
				throw Error("no ws after connect");
			
			if (typeof message === 'object')
				message = JSON.stringify(message);

			try {
				ws.send(message); // it can fail even if readyState was on OPEN
			} catch (e) {
				console.log('failed send ' + e.toString());
				return setTimeout(async ()=>{
					await this.send(message);
					resolve();
				}, 500)
			}
			resolve();
		});
	}

	async subscribeOrderbook(baseToken, quoteToken, pairName) {
		console.log(baseToken + ' '+ quoteToken + ' ' +pairName);
		this.store.commit('addPair', {pairName , baseToken, quoteToken});
	
		const message = {
			"channel": "orderbook",
			"event": {
				"type": "SUBSCRIBE",
				"payload": {
					"baseToken": baseToken,
					"quoteToken": quoteToken,
					"name": pairName,
				}
			}
		};
		return await this.send(message);
	}

}


module.exports = new WsEmitter();
