Two [autonomous agents](https://developer.obyte.org/autonomous-agents) work together to handle betting tokens.

### Issuer AA

For every match available, an autonomous agent is to be created based on this [template](AAs/asset-issuer/asset-issuer.ojson) with the following  set of parameters:

```js
"params": {
	"oracle": "TKT4UESIKTTRALRRLWS4SENSTJX6ODCW", // oracle address
	"home_team": "B04", // home team as encoded in the feedname
	"away_team": "BAY", // away team as encoded in the feedname
	"championship": "BL1", // championship as encoded in the feedname
	"fixture_date": "2020-06-06",  // date of the fixture
}
```

Then the autonomous can be triggered in 2 different ways.

1. An amount superior to 10000 bytes is sent:
- 4 different assets are defined (if not defined before), one for every possible outcome: home team wins, away team wins, draw or canceled fixture.
- for each asset, an amount equal to the amount of bytes minus 10000 is sent to the trigger address.

2. An amount of at least 1000 of any, and only one, priorly issued assets is sent:
- if the asset corresponds to the result posted by the sports oracle, then an equal amount of bytes minus 1000 is sent to the trigger address.
- if the asset is for a canceled fixture and the sports-oracle posted nothing five days after the fixture, then an equal amount of bytes minus 1000 is sent to the trigger address.

### Short lived token registry AA

The users never interact directly with this AA, it is triggered only by the issuer AA. Every time an asset is defined, the issuer triggers the token registry and indicates what symbol should be linked to its id. The registry also triggers back the issuer AA to allow the next asset to be defined or issued, with this trick all assets can be issued from only one initial triggering from an user.

The symbol is then stored in several state vars under different indexation.

1. Symbol to asset
Format: `s2a_SYMBOL|ISSUER_BASE_AA|ORACLE: ASSET`
eg: `s2a_BL1_B04_BAY_2020-06-06-DRAW|UPGVQBNM6YOZS5OG7QFB2O2P4UF3LQNR|TKT4UESIKTTRALRRLWS4SENSTJX6ODCW: "+ajdDRubnZkRqUKvcvSrZbwjioaXdnD3HTyUa3CXKlE="`

2. Asset to symbol
Format: `a2s_ASSET|ISSUER_BASE_AA|ORACLE: SYMBOL`
eg: `a2s_+ajdDRubnZkRqUKvcvSrZbwjioaXdnD3HTyUa3CXKlE=|UPGVQBNM6YOZS5OG7QFB2O2P4UF3LQNR|TKT4UESIKTTRALRRLWS4SENSTJX6ODCW: "BL1_B04_BAY_2020-06-06-DRAW"`

3. Decimals
Format: `decimals_ASSET|ISSUER_BASE_AA|ORACLE: decimals`
eg: `decimals_+ajdDRubnZkRqUKvcvSrZbwjioaXdnD3HTyUa3CXKlE=|UPGVQBNM6YOZS5OG7QFB2O2P4UF3LQNR|TKT4UESIKTTRALRRLWS4SENSTJX6ODCW: 9`

The registry is open and can potentially be used for other kind of asset that can be systematically named after their parameters. It's up to the application that uses the registry to whitelist which couples of base AA and oracle can be trusted. For Odex, this done there.

### Tests

To minimize the risk of potential flaws, tests have been written for these AAs using the [aa-testkit](https://github.com/valyakin/aa-testkit)
Tests can be run with:
`cd AAs`
`npm install`
`npm run test`