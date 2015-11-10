var rest = require('./rest.js');

rest.prepareRoutes();
rest.start(function() {
	console.log("running");
});