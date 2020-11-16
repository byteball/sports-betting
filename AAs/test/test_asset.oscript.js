const path = require('path')
const objectHash = require('ocore/object_hash.js');

// eslint-disable-next-line no-unused-vars
const { Testkit, Utils } = require('aa-testkit')
const { Network } = Testkit({
	TESTDATA_DIR: path.join(__dirname, '../testdata'),
})


describe('Define AAs test', function () {
	this.timeout(120 * 1000)

	var network;
	const alice_reserve_amount_paid = 1000000;
	const issuer_0_bob_base_amount_paid = 2800000;
	const issuer_1_bob_base_amount_paid = 506044;

	const timeout_in_day = 5; // hard coded in AA
	const time_now = new Date()

	const issuer_0_fixture_days_from_now = 3;
	const issuer_0_fixture_day = new Date(time_now.getTime() + issuer_0_fixture_days_from_now * 24 * 3600 * 1000).toISOString().slice(0,-14)
	const issuer_0_fixture_timeout_day = new Date(time_now.getTime() + (issuer_0_fixture_days_from_now + timeout_in_day) * 24 * 3600 * 1000).toISOString().slice(0,-14)

	const issuer_1_fixture_days_from_now = 10;
	const issuer_1_fixture_day = new Date(time_now.getTime() + issuer_1_fixture_days_from_now * 24 * 3600 * 1000).toISOString().slice(0,-14)
	const issuer_1_fixture_before_timeout_day = new Date(time_now.getTime() + (issuer_1_fixture_days_from_now + timeout_in_day - 1) * 24 * 3600 * 1000).toISOString().slice(0,-14)


	before(async () => {
		network = await Network.create()
		.with.agent({ sl_registry: path.join(__dirname, '../registry/sl_token_registry.ojson') })
		.with.agent({ dec_registry: path.join(__dirname, '../registry/dec_token_registry.ojson') })
		.with.agent({ base_aa_issuer: path.join(__dirname, '../asset-issuer/asset-issuer.ojson')})
		.with.asset({ random_asset: {} })
		.with.asset({ reserve_asset: {} })
		.with.wallet({ alice: 15e9})
		.with.wallet({ oracle: 1e9})
		.with.wallet({ bob: 10e9 })
		.with.explorer()
		.run()

		var { unit, error } = await network.deployer.sendMulti({
			asset: network.asset.random_asset,
					asset_outputs:[{
						address: await network.wallet.alice.getAddress(),
						amount: 50e9
					},
					{
						address: await network.wallet.bob.getAddress(),
						amount: 10e9
					}]
			}
		);

		var { unit, error } = await network.deployer.sendMulti({
			asset: network.asset.reserve_asset,
					asset_outputs:[{
						address: await network.wallet.alice.getAddress(),
						amount: 40e9
					},
					{
						address: await network.wallet.bob.getAddress(),
						amount: 15e9
					}]
			}
		);
		
		console.log("sl_registry: " + network.agent.sl_registry);
		console.log("dec_registry: " + network.agent.dec_registry);
		console.log("issuer base aa:" + network.agent.base_aa_issuer);
		console.log("oracle:" + await network.wallet.oracle.getAddress());
		console.log("alice address: " + await network.wallet.alice.getAddress());
		console.log("bob address: " + await network.wallet.bob.getAddress());

		var { address, unit, error } = await network.deployer.deployAgent(`[
			"autonomous agent",
			{
					"base_aa": "${network.agent.base_aa_issuer}",
					"params": {
							"oracle": "${ await network.wallet.oracle.getAddress()}",
							"championship":"BL1",
							"home_team":"BYM",
							"away_team":"LMA",
							"fixture_date": "${issuer_0_fixture_day}",
							"reserve_asset":"${network.asset.reserve_asset}",
					}
			}
		]`)

		this.issuer_0_address = address;
		this.issuer_0_feed_name = "BL1" + "_" + "BYM"+ "_" + "LMA" + "_" + issuer_0_fixture_day;
		this.issuer_0_hometeam = "BYM";
		this.issuer_0_awayteam = "LMA";


		var { address, unit, error } = await network.deployer.deployAgent(`[
			"autonomous agent",
			{
					"base_aa": "${network.agent.base_aa_issuer}",
					"params": {
							"oracle": "${ await network.wallet.oracle.getAddress()}",
							"championship":"PL",
							"home_team":"MUN",
							"away_team":"LIV",
							"fixture_date": "${issuer_1_fixture_day}",
							"reserve_asset":"${network.asset.reserve_asset}",
					}
			}
		]`)

		this.issuer_1_address = address;
		this.issuer_1_feed_name = "PL" + "_" + "MUN"+ "_" + "LIV" + "_" + issuer_1_fixture_day;
		this.issuer_1_hometeam = "MUN";
		this.issuer_1_awayteam = "LIV";


		await network.witnessUntilStable(unit)

	});


	it('alice tries to issue while symbol is undefined', async () => {

		var { unit, error } = await network.wallet.alice.sendMulti({

			asset: network.asset.reserve_asset,
					asset_outputs:[{
						amount: alice_reserve_amount_paid,
						address: this.issuer_0_address,
					}],
					base_outputs:[{
						amount:  20000,
						address: this.issuer_0_address,
					}]
			}
		);

		await network.witnessUntilStable(unit)
		var { response } = await network.getAaResponseToUnit(unit)

		expect(response.response.error).to.be.equal('no symbol for reserve asset');
		expect(response.bounced).to.be.true;
	})

	it('bob defines symbol', async () => {
		var { unit, error } = await network.wallet.bob.triggerAaWithData({
			toAddress: network.agent.dec_registry,
			amount: 1000000000,
			data: {
				asset: network.asset.reserve_asset,
				symbol: 'OUSD',
			}
		})

		var { response } = await network.getAaResponseToUnit(unit)
		expect(response.response.error).to.be.equal(undefined);
		expect(response.bounced).to.be.false;
	});
	it('bob defines decimals', async () => {
		var { unit, error } = await network.wallet.bob.triggerAaWithData({
			toAddress: network.agent.dec_registry,
			amount: 10000,
			data: {
				asset: network.asset.reserve_asset,
				decimals: 4,
				description: 'USD bonded stable coin'
			}
		})

		var { response } = await network.getAaResponseToUnit(unit)
		expect(response.response.error).to.be.equal(undefined);
		expect(response.bounced).to.be.false;
	});

	it('alice defines and issues assets issuer_0', async () => {

		var { unit, error } = await network.wallet.alice.sendMulti({

			asset: network.asset.reserve_asset,
					asset_outputs:[{
						amount: alice_reserve_amount_paid,
						address: this.issuer_0_address,
					}],
					base_outputs:[{
						amount:  10000,
						address: this.issuer_0_address,
					}]
			}
		);

		await network.witnessUntilStable(unit)
		var { response } = await network.getAaResponseToUnit(unit)

		expect(response.response.error).to.be.equal(undefined);
		expect(response.bounced).to.be.false;

		await network.sync()
		var { vars } = await network.deployer.readAAStateVars(this.issuer_0_address)

		expect(vars["hometeam"]).to.be.validUnit;
		expect(vars["awayteam"]).to.be.validUnit;
		expect(vars["draw"]).to.be.validUnit;
		expect(vars["canceled"]).to.be.validUnit;
		expect(vars["amount_to_pay"]).to.be.equal((alice_reserve_amount_paid));

		var alice_balances = await network.wallet.alice.getBalance();
		expect(Object.keys(alice_balances).length).to.be.equal(7); // base + reserve asset + 4 betting assets + random_asset
		expect(alice_balances[vars["hometeam"]].stable).to.be.equal(alice_reserve_amount_paid);
		expect(alice_balances[vars["awayteam"]].stable).to.be.equal(alice_reserve_amount_paid);
		expect(alice_balances[vars["draw"]].stable).to.be.equal(alice_reserve_amount_paid);
		expect(alice_balances[vars["canceled"]].stable).to.be.equal(alice_reserve_amount_paid);

		this.hometeam_asset = vars["hometeam"];
		this.awayteam_asset = vars["awayteam"];
		this.draw_asset = vars["draw"];
		this.canceled_asset = vars["canceled"];

		var { vars } = await network.deployer.readAAStateVars(network.agent.sl_registry);

		var right_part = '|' + network.agent.base_aa_issuer + '|' + await network.wallet.oracle.getAddress();

		var hometeam_symbol =  this.issuer_0_feed_name + '-' + this.issuer_0_hometeam + '-OUSD';
		expect(vars['s2a_' + hometeam_symbol + right_part]).to.be.equal(this.hometeam_asset)
		expect(vars['a2s_' + this.hometeam_asset +  right_part]).to.be.equal(hometeam_symbol)
		expect(vars['decimals_' + this.hometeam_asset +  right_part]).to.be.equal(4)


		var awayteam_symbol =  this.issuer_0_feed_name + '-' + this.issuer_0_awayteam + '-OUSD';
		expect(vars['s2a_' + awayteam_symbol + right_part]).to.be.equal(this.awayteam_asset)
		expect(vars['a2s_' + this.awayteam_asset +  right_part]).to.be.equal(awayteam_symbol)
		expect(vars['decimals_' + this.awayteam_asset +  right_part]).to.be.equal(4)

		var draw_symbol =  this.issuer_0_feed_name + '-DRAW-OUSD';
		expect(vars['s2a_' + draw_symbol + right_part]).to.be.equal(this.draw_asset)
		expect(vars['a2s_' + this.draw_asset +  right_part]).to.be.equal(draw_symbol)
		expect(vars['decimals_' + this.draw_asset +  right_part]).to.be.equal(4)

		var canceled_symbol =  this.issuer_0_feed_name + '-CANCELED-OUSD';
		expect(vars['s2a_' + canceled_symbol + right_part]).to.be.equal(this.canceled_asset)
		expect(vars['a2s_' + this.canceled_asset +  right_part]).to.be.equal(canceled_symbol)
		expect(vars['decimals_' + this.canceled_asset +  right_part]).to.be.equal(4)

	})

	it('bob sends bytes instead of assets to assets issuer_0', async () => {
		var { unit, error } = await network.wallet.bob.sendBytes({ toAddress: this.issuer_0_address , amount: issuer_0_bob_base_amount_paid });
		var { response } = await network.getAaResponseToUnit(unit)

		expect(response.response.error).to.be.equal("base amount exceeds fees");
		expect(response.bounced).to.be.true;
	})

	it('bob issues assets issuer_0', async () => {

		var { unit, error } = await network.wallet.bob.sendMulti({

			asset: network.asset.reserve_asset,
					asset_outputs:[{
						amount: issuer_0_bob_base_amount_paid,
						address: this.issuer_0_address,
					}],
					base_outputs:[{
						amount:  10000,
						address: this.issuer_0_address,
					}]
			}
		);


		var { response } = await network.getAaResponseToUnit(unit)

		expect(response.response.error).to.be.equal(undefined);
		expect(response.bounced).to.be.false;

		await network.witnessUntilStable(unit)

		await network.sync()
		const { vars } = await network.deployer.readAAStateVars(this.issuer_0_address)

		expect(vars["hometeam"]).to.be.equal(this.hometeam_asset);
		expect(vars["awayteam"]).to.be.equal(this.awayteam_asset);
		expect(vars["draw"]).to.be.equal(this.draw_asset);
		expect(vars["canceled"]).to.be.equal(this.canceled_asset);
		expect(vars["amount_to_pay"]).to.be.equal((alice_reserve_amount_paid));

		var bob_balances = await network.wallet.bob.getBalance();
		expect(Object.keys(bob_balances).length).to.be.equal(7); // base + 4 betting assets + reserve asset + random asset
		expect(bob_balances[this.hometeam_asset].pending).to.be.equal(issuer_0_bob_base_amount_paid);
		expect(bob_balances[this.awayteam_asset].pending).to.be.equal(issuer_0_bob_base_amount_paid);
		expect(bob_balances[this.draw_asset].pending).to.be.equal(issuer_0_bob_base_amount_paid);
		expect(bob_balances[this.canceled_asset].pending).to.be.equal(issuer_0_bob_base_amount_paid);

		var alice_balances = await network.wallet.alice.getBalance();
		expect(alice_balances[this.hometeam_asset].stable).to.be.equal(alice_reserve_amount_paid);
		expect(alice_balances[this.awayteam_asset].stable).to.be.equal(alice_reserve_amount_paid);
		expect(alice_balances[this.draw_asset].stable).to.be.equal(alice_reserve_amount_paid);
		expect(alice_balances[this.canceled_asset].stable).to.be.equal(alice_reserve_amount_paid);

	})

	it('alice tries to withdraw issuer_0 before oracle posting', async () => {

		var { unit, error } = await network.wallet.alice.sendMulti({

			asset: this.hometeam_asset,
					asset_outputs:[{
						amount: alice_reserve_amount_paid ,
						address: this.issuer_0_address,
					}],
					base_outputs:[{
						amount:  10000,
						address: this.issuer_0_address,
					}]
			}
		);
		await network.witnessUntilStable(unit)
		await network.sync()
		var { response } = await network.getAaResponseToUnit(unit)

		expect(response.bounced).to.be.true
		expect(response.response.error).to.be.equal("home team didn't win")

		var { unit, error } = await network.wallet.alice.sendMulti({
					asset: this.awayteam_asset,
					asset_outputs:[{
						amount: alice_reserve_amount_paid / 2,
						address: this.issuer_0_address,
					}],
					base_outputs:[{
						amount:  10000,
						address: this.issuer_0_address,
					}]
			}
		);
		await network.witnessUntilStable(unit)

		await network.sync()
		var { response } = await network.getAaResponseToUnit(unit)

		expect(response.bounced).to.be.true
		expect(response.response.error).to.be.equal("away team didn't win")


		var { unit, error } = await network.wallet.alice.sendMulti({

			asset: this.draw_asset,
					asset_outputs:[{
						amount: alice_reserve_amount_paid,
						address: this.issuer_0_address,
					}],
					base_outputs:[{
						amount:  10000,
						address: this.issuer_0_address,
					}]
			}
		);
		await network.witnessUntilStable(unit)

		await network.sync()
		var { response } = await network.getAaResponseToUnit(unit)

		expect(response.bounced).to.be.true
		expect(response.response.error).to.be.equal("there wasn't a draw")
		var { unit, error } = await network.wallet.alice.sendMulti({

			asset: this.canceled_asset,
					asset_outputs:[{
						amount: alice_reserve_amount_paid ,
						address: this.issuer_0_address,
					}],
					base_outputs:[{
						amount:  10000,
						address: this.issuer_0_address,
					}]
			}
		);
		await network.witnessUntilStable(unit)

		await network.sync()
		var { response } = await network.getAaResponseToUnit(unit)

		expect(response.bounced).to.be.true
		expect(response.response.error).to.be.equal("timeout not reached yet")
	})

	it('alice tries withdraw issuer_0 with incorrect assets', async () => {


		var { unit, error } = await network.wallet.alice.sendMulti({

			asset: network.asset.random_asset,
					asset_outputs:[{
						amount: alice_reserve_amount_paid,
						address: this.issuer_0_address,
					}],
					base_outputs:[{
						amount:  10000,
						address: this.issuer_0_address,
					}]
			}
		);
		await network.witnessUntilStable(unit)
		await network.sync()
		var { response } = await network.getAaResponseToUnit(unit)

		expect(response.bounced).to.be.true
		expect(response.response.error).to.be.equal("no betting asset")


		//oracle posts unrelated feedname
		var datafeed = {};
		datafeed["foo"] = "canceled";

		var objMessage = {
			app: "data_feed",
			payload_location: "inline",
			payload_hash: objectHash.getBase64Hash(datafeed),
			payload: datafeed
		};
		var opts = {
			paying_addresses: [await network.wallet.oracle.getAddress()],
			change_address: await network.wallet.oracle.getAddress(),
			messages: [objMessage]
		};


		var { unit, error } = await network.wallet.oracle.sendMulti(opts);


		await network.witnessUntilStable(unit)
		await network.sync()
		var { unit, error } = await network.wallet.alice.sendMulti({

			asset: this.canceled_asset,
					asset_outputs:[{
						amount: alice_reserve_amount_paid,
						address: this.issuer_0_address,
					}],
					base_outputs:[{
						amount:  10000,
						address: this.issuer_0_address,
					}]
			}
		);
		await network.witnessUntilStable(unit)
		await network.sync()
		var { response } = await network.getAaResponseToUnit(unit)

		expect(response.bounced).to.be.true
		expect(response.response.error).to.be.equal("timeout not reached yet")

		//oracle posts home team won
		var datafeed = {};
		datafeed[this.issuer_0_feed_name] = this.issuer_0_hometeam;

		var objMessage = {
			app: "data_feed",
			payload_location: "inline",
			payload_hash: objectHash.getBase64Hash(datafeed),
			payload: datafeed
		};
		var opts = {
			paying_addresses: [await network.wallet.oracle.getAddress()],
			change_address: await network.wallet.oracle.getAddress(),
			messages: [objMessage]
		};


		var { unit, error } = await network.wallet.oracle.sendMulti(opts);

		await network.witnessUntilStable(unit)
		await network.sync()
	
		var { unit, error } = await network.wallet.alice.sendMulti({

			asset: this.awayteam_asset,
					asset_outputs:[{
						amount: alice_reserve_amount_paid / 2,
						address: this.issuer_0_address,
					}],
					base_outputs:[{
						amount:  10000,
						address: this.issuer_0_address,
					}]
			}
		);
		await network.witnessUntilStable(unit)

		await network.sync()
		var { response } = await network.getAaResponseToUnit(unit)

		expect(response.bounced).to.be.true
		expect(response.response.error).to.be.equal("away team didn't win")


		var { unit, error } = await network.wallet.alice.sendMulti({

			asset: this.draw_asset,
					asset_outputs:[{
						amount: alice_reserve_amount_paid,
						address: this.issuer_0_address,
					}],
					base_outputs:[{
						amount:  10000,
						address: this.issuer_0_address,
					}]
			}
		);
		await network.witnessUntilStable(unit)

		await network.sync()
		var { response } = await network.getAaResponseToUnit(unit)

		expect(response.bounced).to.be.true
		expect(response.response.error).to.be.equal("there wasn't a draw")

		var { error } = await network.timetravel({ to: issuer_0_fixture_day })
		expect(error).to.be.null

		var { unit, error } = await network.wallet.alice.sendMulti({

			asset: this.canceled_asset,
					asset_outputs:[{
						amount: alice_reserve_amount_paid,
						address: this.issuer_0_address,
					}],
					base_outputs:[{
						amount:  10000,
						address: this.issuer_0_address,
					}]
			}
		);
		await network.witnessUntilStable(unit)

		await network.sync()
		var { response } = await network.getAaResponseToUnit(unit)

		expect(response.bounced).to.be.true
		expect(response.response.error).to.be.equal("there wasn't a cancelation or postponement")
	})
		
	it('alice partially withdraws issuer_0', async () => {
	
		var { unit, error } = await network.wallet.alice.sendMulti({

			asset: this.hometeam_asset,
					asset_outputs:[{
						amount: alice_reserve_amount_paid / 2,
						address: this.issuer_0_address,
					}],
					base_outputs:[{
						amount:  10000,
						address: this.issuer_0_address,
					}]
			}
		)
		await network.witnessUntilStable(unit)
		await network.sync()
		var { response } = await network.getAaResponseToUnit(unit)
		expect(response.response.error).to.be.equal(undefined)
		expect(response.bounced).to.be.false
		var { unitObj } = await network.wallet.alice.getUnitInfo({ unit: response.response_unit })
		expect(Utils.hasOnlyTheseExternalPayments(unitObj,[{
			address: await network.wallet.alice.getAddress(),
			amount: alice_reserve_amount_paid / 2,
			asset: network.asset.reserve_asset

		}])).to.be.true;
	});


	it('alice tries withdraw issuer_0 with wrong assets when deadline reached', async () => {
	
		var { error } = await network.timetravel({ to: issuer_0_fixture_timeout_day })
		var { unit, error } = await network.wallet.alice.sendMulti({

			asset: this.canceled_asset,
					asset_outputs:[{
						amount: alice_reserve_amount_paid,
						address: this.issuer_0_address,
					}],
					base_outputs:[{
						amount:  10000,
						address: this.issuer_0_address,
					}]
			}
		);
		await network.witnessUntilStable(unit)

		await network.sync()
		var { response } = await network.getAaResponseToUnit(unit)

		expect(response.bounced).to.be.true
		expect(response.response.error).to.be.equal("there wasn't a cancelation or postponement")

	})

	it('bob fully withdraws issuer_0', async () => {
	
		var { unit, error } = await network.wallet.bob.sendMulti({

			asset: this.hometeam_asset,
					asset_outputs:[{
						amount: issuer_0_bob_base_amount_paid,
						address: this.issuer_0_address,
					}],
					base_outputs:[{
						amount:  10000,
						address: this.issuer_0_address,
					}]
			}
		)
		await network.witnessUntilStable(unit)
		await network.sync()
		var { response } = await network.getAaResponseToUnit(unit)
		expect(response.bounced).to.be.false
		var { unitObj } = await network.wallet.bob.getUnitInfo({ unit: response.response_unit })
		expect(Utils.hasOnlyTheseExternalPayments(unitObj,[{
			address: await network.wallet.bob.getAddress(),
			amount: issuer_0_bob_base_amount_paid,
			asset: network.asset.reserve_asset
		}])).to.be.true;
	});

	it('alice fully withdraws issuer_0', async () => {
	
		var { unit, error } = await network.wallet.alice.sendMulti({

			asset: this.hometeam_asset,
					asset_outputs:[{
						amount: alice_reserve_amount_paid / 2,
						address: this.issuer_0_address,
					}],
					base_outputs:[{
						amount:  10000,
						address: this.issuer_0_address,
					}]
			}
		)
		await network.witnessUntilStable(unit)
		await network.sync()
		var { response } = await network.getAaResponseToUnit(unit)
		expect(response.bounced).to.be.false
		var { unitObj } = await network.wallet.alice.getUnitInfo({ unit: response.response_unit })
		expect(Utils.hasOnlyTheseExternalPayments(unitObj,[{
			address: await network.wallet.alice.getAddress(),
			amount: alice_reserve_amount_paid / 2,
			asset: network.asset.reserve_asset
		}])).to.be.true;
	});

	it('bob defines and issues assets issuer_1', async () => {
		var { unit, error } = await network.wallet.bob.sendMulti({

			asset: network.asset.reserve_asset,
					asset_outputs:[{
						amount: issuer_1_bob_base_amount_paid,
						address: this.issuer_1_address,
					}],
					base_outputs:[{
						amount:  20000,
						address: this.issuer_1_address,
					}]
			}
		);

		await network.witnessUntilStable(unit)
		await network.sync()
		var { vars } = await network.deployer.readAAStateVars(this.issuer_1_address)

		expect(vars["hometeam"]).to.be.validUnit;
		expect(vars["awayteam"]).to.be.validUnit;
		expect(vars["draw"]).to.be.validUnit;
		expect(vars["canceled"]).to.be.validUnit;
		expect(vars["amount_to_pay"]).to.be.equal(issuer_1_bob_base_amount_paid);

		var bob_balances = await network.wallet.bob.getBalance();
		expect(Object.keys(bob_balances).length).to.be.equal(11); // base + 4 betting assets + reserve asset + random_asset + 4 betting assets
		expect(bob_balances[vars["hometeam"]].pending).to.be.equal(issuer_1_bob_base_amount_paid);
		expect(bob_balances[vars["awayteam"]].pending).to.be.equal(issuer_1_bob_base_amount_paid);
		expect(bob_balances[vars["draw"]].pending).to.be.equal(issuer_1_bob_base_amount_paid);
		expect(bob_balances[vars["canceled"]].pending).to.be.equal(issuer_1_bob_base_amount_paid);

		this.hometeam_asset = vars["hometeam"];
		this.awayteam_asset = vars["awayteam"];
		this.draw_asset = vars["draw"];
		this.canceled_asset = vars["canceled"];

		var { vars } = await network.deployer.readAAStateVars(network.agent.sl_registry);

		var right_part = '|' + network.agent.base_aa_issuer + '|' + await network.wallet.oracle.getAddress();

		var hometeam_symbol =  this.issuer_1_feed_name + '-' + this.issuer_1_hometeam + '-OUSD';
		expect(vars['s2a_' + hometeam_symbol + right_part]).to.be.equal(this.hometeam_asset)
		expect(vars['a2s_' + this.hometeam_asset +  right_part]).to.be.equal(hometeam_symbol)

		var awayteam_symbol =  this.issuer_1_feed_name + '-' + this.issuer_1_awayteam + '-OUSD';
		expect(vars['s2a_' + awayteam_symbol + right_part]).to.be.equal(this.awayteam_asset)
		expect(vars['a2s_' + this.awayteam_asset +  right_part]).to.be.equal(awayteam_symbol)

		var draw_symbol =  this.issuer_1_feed_name + '-DRAW-OUSD';
		expect(vars['s2a_' + draw_symbol + right_part]).to.be.equal(this.draw_asset)
		expect(vars['a2s_' + this.draw_asset +  right_part]).to.be.equal(draw_symbol)

		var canceled_symbol =  this.issuer_1_feed_name + '-CANCELED-OUSD';
		expect(vars['s2a_' + canceled_symbol + right_part]).to.be.equal(this.canceled_asset)
		expect(vars['a2s_' + this.canceled_asset +  right_part]).to.be.equal(canceled_symbol)

	})

	it('bob tries withdraw issuer_1 with canceled asset when deadline is not reached yet', async () => {
		var { error } = await network.timetravel({ to: issuer_1_fixture_before_timeout_day })
		var { unit, error } = await network.wallet.bob.sendMulti({
					base_outputs:[{
						amount:  10000,
						address: await network.wallet.bob.getAddress(),
					}]
			}
		);
		await network.witnessUntilStable(unit)

		var { unit, error } = await network.wallet.bob.sendMulti({
			asset: this.canceled_asset,
					asset_outputs:[{
						amount: issuer_1_bob_base_amount_paid,
						address: this.issuer_1_address,
					}],
					base_outputs:[{
						amount:  10000,
						address: this.issuer_1_address,
					}]
			}
		);
		await network.witnessUntilStable(unit)
		await network.sync()

		var { response } = await network.getAaResponseToUnit(unit)

		expect(response.bounced).to.be.true
		expect(response.response.error).to.be.equal("timeout not reached yet")
		await network.witnessUntilStable(response.unit)


	})

	it('bob fully withdraw issuer_1 with canceled asset when deadline is reached', async () => {
		var { error } = await network.timetravel({ shift: '24h' })

		var { unit, error } = await network.wallet.bob.sendMulti({
			base_outputs:[{
				amount:  10000,
				address: await network.wallet.bob.getAddress(),
			}]
			}
		);
		await network.witnessUntilStable(unit)

		var { unit, error } = await network.wallet.bob.sendMulti({
			asset: this.canceled_asset,
					asset_outputs:[{
						amount: issuer_1_bob_base_amount_paid,
						address: this.issuer_1_address,
					}],
					base_outputs:[{
						amount:  10000,
						address: this.issuer_1_address,
					}]
			}
		);
		await network.witnessUntilStable(unit)
		await network.sync()
		var { response } = await network.getAaResponseToUnit(unit)
		expect(response.bounced).to.be.false
		var { unitObj } = await network.wallet.alice.getUnitInfo({ unit: response.response_unit })
		expect(Utils.hasOnlyTheseExternalPayments(unitObj,[{
			address: await network.wallet.bob.getAddress(),
			amount: issuer_1_bob_base_amount_paid,
			asset: network.asset.reserve_asset
		}])).to.be.true;
	})


	after(async () => {
		// uncomment this line to pause test execution to get time for Obyte DAG explorer inspection
		//await Utils.sleep(3600 * 1000)
		await network.stop()
	})
})
