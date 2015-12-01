var rest = require('./rest.js');
var Inert = require('inert');
var Vision = require('vision');
var HapiSwagger = require('hapi-swagger');
var Pack = require('./package');

rest.prepareRoutes();

var swaggerOptions = {
    apiVersion: Pack.version
}

rest.register([
	Inert,
	Vision,
	{
		register: HapiSwagger,
		options: swaggerOptions
	}] , function(err) {
		rest.start(function() {
			console.log('Server running!');
		});
	})
