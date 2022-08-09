# Backend

The backend is a light Obyte node that watches the sports betting AAs to gather informations about the current states and serves an API used by the frontend.

It provides list of past and upcoming matches with the following informations:

- Championship (or league)
- Home team
- Away team
- Date
- asset issuer address (if the asset issuer has been defined)
- id of each kind of asset (if betting assets have been issued)
- posted result (f the result has been posted by oracle)

## Installation

Require NodeJs version 8 to 11.

`npm install`
`node start`

For testnet set `testnet=1` as environment variable.

### NGINX reverse proxy

The webserver listens port 1861 on mainnet and 1860 on testnet, NGINX is to be used as reverse proxy to accept SSL connections on port 443. There is the relevant configuration:

```
location /api/ {
	proxy_pass http://localhost:1861; // 1860 for testnet
	proxy_http_version 1.1;
	proxy_set_header Upgrade $http_upgrade;
	proxy_set_header Connection 'upgrade';
	proxy_set_header Host $host;
	proxy_cache_bypass $http_upgrade;
}
```

## Endpoints

- `/api/categories`: return active categories, their championships and number of matches available for each of them

```json
{
	"Basketball": [{
		"championship": "NBA",
		"nb_fixtures": 88,
		"nb_incoming_fixtures": 88
	}],
	"Soccer": [{
		"championship": "CL",
		"nb_fixtures": 6,
		"nb_incoming_fixtures": 6
	}, {
		"championship": "DED",
		"nb_fixtures": 0,
		"nb_incoming_fixtures": 0
	}, {
		"championship": "PD",
		"nb_fixtures": 40,
		"nb_incoming_fixtures": 0
	}, {
		"championship": "FL1",
		"nb_fixtures": 0,
		"nb_incoming_fixtures": 0
	}, {
		"championship": "SA",
		"nb_fixtures": 80,
		"nb_incoming_fixtures": 32
	}, {
		"championship": "PL",
		"nb_fixtures": 50,
		"nb_incoming_fixtures": 10
	}]
}

```

- `/api/championships_by_cat/<cat>` return championships for a category

```json
[{
	"championship": "CL",
	"nb_fixtures": 6,
	"nb_incoming_fixtures": 6
}, {
	"championship": "DED",
	"nb_fixtures": 0,
	"nb_incoming_fixtures": 0
}, {
	"championship": "PD",
	"nb_fixtures": 40,
	"nb_incoming_fixtures": 0
}, {
	"championship": "FL1",
	"nb_fixtures": 0,
	"nb_incoming_fixtures": 0
}, {
	"championship": "SA",
	"nb_fixtures": 80,
	"nb_incoming_fixtures": 32
}, {
	"championship": "PL",
	"nb_fixtures": 50,
	"nb_incoming_fixtures": 10
}]

```

- `/api/fixtures` return all matches available for betting

```json
[{
		"homeTeam": "New Orleans Pelicans",
		"awayTeam": "Utah Jazz",
		"feedHomeTeamName": "NOP",
		"feedAwayTeamName": "UTA",
		"date": "2020-07-30T22:30:00.000Z",
		"localDay": "2020-07-30",
		"championship": "NBA"
	}, {
		"homeTeam": "Los Angeles Lakers",
		"awayTeam": "Los Angeles Clippers",
		"feedHomeTeamName": "LAL",
		"feedAwayTeamName": "LAC",
		"date": "2020-07-31T01:00:00.000Z",
		"localDay": "2020-07-30",
		"championship": "NBA"
	}, {
		"homeTeam": "Brooklyn Nets",
		"awayTeam": "Orlando Magic",
		"feedHomeTeamName": "BKN",
		"feedAwayTeamName": "ORL",
		"date": "2020-07-31T18:30:00.000Z",
		"localDay": "2020-07-31",
		"championship": "NBA"
	}, {
		"homeTeam": "Portland Trail Blazers",
		"awayTeam": "Memphis Grizzlies",
		"feedHomeTeamName": null,
		"feedAwayTeamName": "MEM",
		"date": "2020-07-31T20:00:00.000Z",
		"localDay": "2020-07-31",
		"championship": "NBA"
	},
 	...
 ]

```

- `/api/fixtures_by_cat/<cat>` return all matches available for betting for a category

- `/api/fixtures_by_championship/<championship>` return all matches available for betting for a championship

- `/api/fixtures_by_team/<team>` 

