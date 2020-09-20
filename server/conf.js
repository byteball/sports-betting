/*jslint node: true */
"use strict";
exports.bServeAsHub = false;
exports.bLight = true;

exports.api_port = process.env.testnet ? 1860 : 1861;
exports.hub = process.env.testnet ? 'obyte.org/bb-test' : 'obyte.org/bb';

exports.issuer_base_aa = "K6KIVWTU5C4JPSIQF5F42XYIQIIBHOIP";

exports.oracle_address = process.env.testnet ? '4EHFJW5EY74DG6PGSXX5CHF5F2FFIJX4' : 'TKT4UESIKTTRALRRLWS4SENSTJX6ODCW';
exports.oracle_pairing_code = process.env.testnet ? 'A1ZoOTmbiKZ1IaUzRn+z9OBW8xQnqDS3EawWaFE6lyY0@obyte.org/bb-test#0000' : 'Ar1O7dGgkkcABYNAbShlY2Pbx6LmUzoyRh6F14vM0vTZ@obyte.org/bb#0000'; 
