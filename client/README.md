# frontend

## Run locally for dev purposes

`npm install`
`npm run serve`

The application will only connect with a backend run locally.
For testnet set `testnet=1` as environment variable.


## Build for web server

`npm install`
`npm run serve`

To build for testnet set `testnet=1` as environment variable.

The static files are created in `dist` folder.
The relevant Nginx configuration to serve them with NGINX is the following:
location / {
	root /home/betting/sports-betting/client/dist/;
	try_files $uri /index.html;
}
