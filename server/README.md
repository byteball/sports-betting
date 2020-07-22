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

Documentation coming soon.