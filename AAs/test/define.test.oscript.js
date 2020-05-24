const path = require('path')
// eslint-disable-next-line no-unused-vars
const { Testkit, Utils } = require('aa-testkit')
const { Network } = Testkit({
	TESTDATA_DIR: path.join(__dirname, '../testdata'),
})


describe('Check AA counterstake question creation', function () {
	this.timeout(120 * 1000)

	before(async () => {
		this.network = await Network.create()
		this.explorer = await this.network.newObyteExplorer().ready()
		this.genesis = await this.network.getGenesisNode().ready()
		this.deployer = await this.network.newHeadlessWallet().ready()

		this.user = await this.network.newHeadlessWallet().ready()

		await this.genesis.sendBytes({
			toAddress: await this.deployer.getAddress(),
			amount: 1e9,
		})

		const { unit, error } = await this.genesis.sendBytes({
			toAddress: await this.user.getAddress(),
			amount: 1e9,
		})

		expect(error).to.be.null
		expect(unit).to.be.validUnit

		await this.network.witnessUntilStable(unit)
	})


	it('Deploy registery test AA', async () => {
		const { address, unit, error } = await this.deployer.deployAgent(path.join(__dirname, './registery/test.ojson'))

		expect(error).to.be.null
		expect(unit).to.be.validUnit
		expect(address).to.be.validAddress

		this.registeryAaAddress = address
		await this.network.witnessUntilStable(unit)
	})

	it('Deploy issuer test AA', async () => {
		const { address, unit, error } = await this.deployer.deployAgent(path.join(__dirname, './asset-issuer/test.ojson'))

		expect(error).to.be.null
		expect(unit).to.be.validUnit
		expect(address).to.be.validAddress

		this.issuerAaAddress = address
		await this.network.witnessUntilStable(unit)
	})



	it('user sends define command', async () => {
		const { unit, error } = await this.creator.triggerAaWithData({
			toAddress: this.issuerAaAddress,
			amount: 1e5,
			data: {
				define_assets: 1,
			},
		})
	})


	after(async () => {
		// uncomment this line to pause test execution to get time for Obyte DAG explorer inspection
		 await Utils.sleep(3600 * 1000)
		await this.network.stop()
	})
})
