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
	const alice_base_amount_paid = 1000000;
	const issuer_0_bob_base_amount_paid = 2800000;
	const issuer_1_bob_base_amount_paid = 506044;

	const timeout_in_day = 5; // hard coded in AA
	const time_now = new Date()

	const issuer_0_fixture_days_from_now = 3;
	const issuer_0_fixture_day = new Date(time_now.getTime() + issuer_0_fixture_days_from_now * 24 * 3600 * 1000).toISOString().slice(0,-14)
	const issuer_0_fixture_timeout_day = new Date(time_now.getTime() + (issuer_0_fixture_days_from_now + timeout_in_day) * 24 * 3600 * 1000).toISOString().slice(0,-14)

	const issuer_1_fixture_days_from_now = 10;
	const issuer_1_fixture_day = new Date(time_now.getTime() + issuer_1_fixture_days_from_now * 24 * 3600 * 1000).toISOString().slice(0,-14)
	const issuer_1_fixture_timeout_day = new Date(time_now.getTime() + (issuer_1_fixture_days_from_now + timeout_in_day) * 24 * 3600 * 1000).toISOString().slice(0,-14)



	console.log("issuer_0_fixture_day: " + issuer_0_fixture_day);
	console.log("issuer_0_fixture_timeout_day: " + issuer_0_fixture_timeout_day);

	before(async () => {
		network = await Network.create()
		.with.agent({ registry: 	path.join(__dirname, '../registry/registry.ojson') })
		.with.agent({ base_aa_issuer: 	path.join(__dirname, '../asset-issuer/asset-issuer.ojson')})
		.with.asset({ random_asset: {} })
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
					}]
			}
		);
		
		console.log("registry: " + network.agent.registry);
		console.log("issuer base aa:" + network.agent.base_aa_issuer);
		console.log("oracle:" + await network.wallet.oracle.getAddress());

		var { address, unit, error } = await network.deployer.deployAgent(`[
			"autonomous agent",
			{
					"base_aa": "${network.agent.base_aa_issuer}",
					"params": {
							"oracle": "${ await network.wallet.oracle.getAddress()}",
							"championship":"BL1",
							"home_team":"BYM",
							"away_team":"LMA",
							"expiry_date": "${issuer_0_fixture_day}"
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
							"expiry_date": "${issuer_1_fixture_day}"
					}
			}
		]`)

		this.issuer_1_address = address;
		this.issuer_1_feed_name = "PL" + "_" + "MUN"+ "_" + "LIV" + "_" + issuer_1_fixture_day;
		this.issuer_1_hometeam = "MUN";
		this.issuer_1_awayteam = "LIV";


		await network.witnessUntilStable(unit)

	});

	it('alice defines and issues assets issuer_0', async () => {
		var { unit, error } = await network.wallet.alice.sendBytes({ toAddress: this.issuer_0_address , amount: alice_base_amount_paid });
		console.log(error);
		await network.witnessUntilStable(unit)

		await network.sync()
		var { vars } = await network.deployer.readAAStateVars(this.issuer_0_address)

		expect(vars["hometeam"]).to.be.validUnit;
		expect(vars["awayteam"]).to.be.validUnit;
		expect(vars["draw"]).to.be.validUnit;
		expect(vars["canceled"]).to.be.validUnit;
		expect(vars["amount_to_paid"]).to.be.equal((alice_base_amount_paid - 10000).toString());

		var alice_balances = await network.wallet.alice.getBalance();
		expect(Object.keys(alice_balances).length).to.be.equal(6); // base + 4 betting assets + random_asset
		expect(alice_balances[vars["hometeam"]].pending).to.be.equal(alice_base_amount_paid - 10000);
		expect(alice_balances[vars["awayteam"]].pending).to.be.equal(alice_base_amount_paid - 10000);
		expect(alice_balances[vars["draw"]].pending).to.be.equal(alice_base_amount_paid - 10000);
		expect(alice_balances[vars["canceled"]].pending).to.be.equal(alice_base_amount_paid - 10000);

		this.hometeam_asset = vars["hometeam"];
		this.awayteam_asset = vars["awayteam"];
		this.draw_asset = vars["draw"];
		this.canceled_asset = vars["canceled"];

		console.log(network.agent.registry);
		var { vars } = await network.deployer.readAAStateVars(network.agent.registry);

		var right_part = '|' + network.agent.base_aa_issuer + '|' + await network.wallet.oracle.getAddress();

		var hometeam_symbol =  this.issuer_0_feed_name + '-' + this.issuer_0_hometeam;
		expect(vars['s2a_' + hometeam_symbol + right_part]).to.be.equal(this.hometeam_asset)
		expect(vars['a2s_' + this.hometeam_asset +  right_part]).to.be.equal(hometeam_symbol)

		var awayteam_symbol =  this.issuer_0_feed_name + '-' + this.issuer_0_awayteam;
		expect(vars['s2a_' + awayteam_symbol + right_part]).to.be.equal(this.awayteam_asset)
		expect(vars['a2s_' + this.awayteam_asset +  right_part]).to.be.equal(awayteam_symbol)

		var draw_symbol =  this.issuer_0_feed_name + '-DRAW';
		expect(vars['s2a_' + draw_symbol + right_part]).to.be.equal(this.draw_asset)
		expect(vars['a2s_' + this.draw_asset +  right_part]).to.be.equal(draw_symbol)

		var canceled_symbol =  this.issuer_0_feed_name + '-CANCELED';
		expect(vars['s2a_' + canceled_symbol + right_part]).to.be.equal(this.canceled_asset)
		expect(vars['a2s_' + this.canceled_asset +  right_part]).to.be.equal(canceled_symbol)

	})


	it('bob issues assets issuer_0', async () => {
		var { unit, error } = await network.wallet.bob.sendBytes({ toAddress: this.issuer_0_address , amount: issuer_0_bob_base_amount_paid });
		console.log(error);
		await network.witnessUntilStable(unit)

		await network.sync()
		const { vars } = await network.deployer.readAAStateVars(this.issuer_0_address)

		expect(vars["hometeam"]).to.be.equal(this.hometeam_asset);
		expect(vars["awayteam"]).to.be.equal(this.awayteam_asset);
		expect(vars["draw"]).to.be.equal(this.draw_asset);
		expect(vars["canceled"]).to.be.equal(this.canceled_asset);
		expect(vars["amount_to_paid"]).to.be.equal((alice_base_amount_paid - 10000).toString());

		var bob_balances = await network.wallet.bob.getBalance();
		expect(Object.keys(bob_balances).length).to.be.equal(5);
		expect(bob_balances[this.hometeam_asset].pending).to.be.equal(issuer_0_bob_base_amount_paid - 10000);
		expect(bob_balances[this.awayteam_asset].pending).to.be.equal(issuer_0_bob_base_amount_paid - 10000);
		expect(bob_balances[this.draw_asset].pending).to.be.equal(issuer_0_bob_base_amount_paid - 10000);
		expect(bob_balances[this.canceled_asset].pending).to.be.equal(issuer_0_bob_base_amount_paid - 10000);

		var alice_balances = await network.wallet.alice.getBalance();
		expect(alice_balances[this.hometeam_asset].stable).to.be.equal(alice_base_amount_paid - 10000);
		expect(alice_balances[this.awayteam_asset].stable).to.be.equal(alice_base_amount_paid - 10000);
		expect(alice_balances[this.draw_asset].stable).to.be.equal(alice_base_amount_paid - 10000);
		expect(alice_balances[this.canceled_asset].stable).to.be.equal(alice_base_amount_paid - 10000);

	})

	it('alice tries to withdraw issuer_0 before oracle posting', async () => {

		var { unit, error } = await network.wallet.alice.sendMulti({

			asset: this.hometeam_asset,
					asset_outputs:[{
						amount: alice_base_amount_paid - 10000,
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
						amount: alice_base_amount_paid / 2 - 10000,
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
						amount: alice_base_amount_paid - 10000,
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
						amount: alice_base_amount_paid - 10000,
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
						amount: alice_base_amount_paid  - 10000,
						address: this.issuer_0_address,
					}],
					base_outputs:[{
						amount:  10000,
						address: this.issuer_0_address,
					}]
			}
		);
		console.log(error);
		await network.witnessUntilStable(unit)
		await network.sync()
		var { response } = await network.getAaResponseToUnit(unit)

		expect(response.bounced).to.be.true
		expect(response.response.error).to.be.equal("foreign asset")


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
						amount: alice_base_amount_paid  - 10000,
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
						amount: alice_base_amount_paid / 2 - 10000,
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
						amount: alice_base_amount_paid  - 10000,
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
						amount: alice_base_amount_paid  - 10000,
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
						amount: alice_base_amount_paid / 2 - 10000,
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
			amount: alice_base_amount_paid / 2 - 10000 - 1000

		}])).to.be.true;
	});


	it('alice tries withdraw issuer_0 with wrong assets when deadline reached', async () => {
	
		var { error } = await network.timetravel({ to: issuer_0_fixture_timeout_day })


		var { unit, error } = await network.wallet.alice.sendMulti({

			asset: this.canceled_asset,
					asset_outputs:[{
						amount: alice_base_amount_paid  - 10000,
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
						amount: issuer_0_bob_base_amount_paid  - 10000,
						address: this.issuer_0_address,
					}],
					base_outputs:[{
						amount:  10000,
						address: this.issuer_0_address,
					}]
			}
		)
		console.log(error);
		await network.witnessUntilStable(unit)
		await network.sync()
		var { response } = await network.getAaResponseToUnit(unit)
		expect(response.bounced).to.be.false
		var { unitObj } = await network.wallet.bob.getUnitInfo({ unit: response.response_unit })
		expect(Utils.hasOnlyTheseExternalPayments(unitObj,[{
			address: await network.wallet.bob.getAddress(),
			amount: issuer_0_bob_base_amount_paid  - 10000 - 1000

		}])).to.be.true;
	});

	it('alice fully withdraws issuer_0', async () => {
	
		var { unit, error } = await network.wallet.alice.sendMulti({

			asset: this.hometeam_asset,
					asset_outputs:[{
						amount: alice_base_amount_paid / 2,
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
			amount: alice_base_amount_paid / 2 - 1000

		}])).to.be.true;
	});

	it('bob defines and issues assets issuer_1', async () => {
		var { unit, error } = await network.wallet.bob.sendBytes({ toAddress: this.issuer_1_address , amount: issuer_1_bob_base_amount_paid });
		await network.witnessUntilStable(unit)
		await network.sync()
		var { vars } = await network.deployer.readAAStateVars(this.issuer_1_address)

		expect(vars["hometeam"]).to.be.validUnit;
		expect(vars["awayteam"]).to.be.validUnit;
		expect(vars["draw"]).to.be.validUnit;
		expect(vars["canceled"]).to.be.validUnit;
		expect(vars["amount_to_paid"]).to.be.equal((issuer_1_bob_base_amount_paid - 10000).toString());

		var bob_balances = await network.wallet.bob.getBalance();
		expect(Object.keys(bob_balances).length).to.be.equal(9); // base + 3 betting assets + random_asset + 4 betting assets
		expect(bob_balances[vars["hometeam"]].pending).to.be.equal(issuer_1_bob_base_amount_paid - 10000);
		expect(bob_balances[vars["awayteam"]].pending).to.be.equal(issuer_1_bob_base_amount_paid - 10000);
		expect(bob_balances[vars["draw"]].pending).to.be.equal(issuer_1_bob_base_amount_paid - 10000);
		expect(bob_balances[vars["canceled"]].pending).to.be.equal(issuer_1_bob_base_amount_paid - 10000);

		this.hometeam_asset = vars["hometeam"];
		this.awayteam_asset = vars["awayteam"];
		this.draw_asset = vars["draw"];
		this.canceled_asset = vars["canceled"];

		console.log(network.agent.registry);
		var { vars } = await network.deployer.readAAStateVars(network.agent.registry);

		var right_part = '|' + network.agent.base_aa_issuer + '|' + await network.wallet.oracle.getAddress();

		var hometeam_symbol =  this.issuer_1_feed_name + '-' + this.issuer_1_hometeam;
		expect(vars['s2a_' + hometeam_symbol + right_part]).to.be.equal(this.hometeam_asset)
		expect(vars['a2s_' + this.hometeam_asset +  right_part]).to.be.equal(hometeam_symbol)

		var awayteam_symbol =  this.issuer_1_feed_name + '-' + this.issuer_1_awayteam;
		expect(vars['s2a_' + awayteam_symbol + right_part]).to.be.equal(this.awayteam_asset)
		expect(vars['a2s_' + this.awayteam_asset +  right_part]).to.be.equal(awayteam_symbol)

		var draw_symbol =  this.issuer_1_feed_name + '-DRAW';
		expect(vars['s2a_' + draw_symbol + right_part]).to.be.equal(this.draw_asset)
		expect(vars['a2s_' + this.draw_asset +  right_part]).to.be.equal(draw_symbol)

		var canceled_symbol =  this.issuer_1_feed_name + '-CANCELED';
		expect(vars['s2a_' + canceled_symbol + right_part]).to.be.equal(this.canceled_asset)
		expect(vars['a2s_' + this.canceled_asset +  right_part]).to.be.equal(canceled_symbol)

	})

	it('bob tries withdraw issuer_1 with canceled asset when deadline is not reached yet', async () => {
		var { error } = await network.timetravel({ to: issuer_1_fixture_timeout_day })
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
						amount: issuer_1_bob_base_amount_paid  - 10000,
						address: this.issuer_1_address,
					}],
					base_outputs:[{
						amount:  10000,
						address: this.issuer_1_address,
					}]
			}
		);
		console.log(error)
		await network.witnessUntilStable(unit)
		await network.sync()


		var { response } = await network.getAaResponseToUnit(unit)

		expect(response.bounced).to.be.true
		expect(response.response.error).to.be.equal("timeout not reached yet")
		await network.witnessUntilStable(response.unit)


	})

	it('bob fully withdraw issuer_1 with canceled asset when deadline is reached', async () => {
		var { error } = await network.timetravel({ shift: '1h' })

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
						amount: issuer_1_bob_base_amount_paid  - 10000,
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
			amount: issuer_1_bob_base_amount_paid - 10000 - 1000
		}])).to.be.true;
	})


	after(async () => {
		// uncomment this line to pause test execution to get time for Obyte DAG explorer inspection
	//	await Utils.sleep(3600 * 1000)
		await network.stop()
	})
})
