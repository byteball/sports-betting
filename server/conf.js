/*jslint node: true */
"use strict";
exports.bServeAsHub = false;
exports.bLight = true;

exports.api_port = process.env.testnet ? 1860 : 1861;
exports.hub = process.env.testnet ? 'obyte.org/bb-test' : 'obyte.org/bb';

exports.issuer_base_aa = "ZZEVOHYFMAR4GOVTD4ZFZOAAHBJS5ZIY";
exports.currencies = process.env.testnet ? [
	'base',
	'UccpQo12uLmufihkzdK7Kcrb5BlHp8GcMrSEA7NVdNw=' // USDC
] :
[
	'base',
	'V/jyPXbGIoRhfBXCEMP/xzMzaAsYC4oT0RWzJhdJs0Y==' // OUSD
];
exports.oracle_address = process.env.testnet ? '4EHFJW5EY74DG6PGSXX5CHF5F2FFIJX4' : 'TKT4UESIKTTRALRRLWS4SENSTJX6ODCW';
exports.oracle_pairing_code = process.env.testnet ? 'A1ZoOTmbiKZ1IaUzRn+z9OBW8xQnqDS3EawWaFE6lyY0@obyte.org/bb-test#0000' : 'Ar1O7dGgkkcABYNAbShlY2Pbx6LmUzoyRh6F14vM0vTZ@obyte.org/bb#0000'; 
exports.token_registry_aa_address = process.env.testnet ? 'O6H6ZIFI57X3PLTYHOCVYPP5A553CYFQ' : 'O6H6ZIFI57X3PLTYHOCVYPP5A553CYFQ';