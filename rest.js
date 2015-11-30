var Hapi = require('hapi');
var handlers = require('./handlers.js');

var server = new Hapi.Server();
server.connection({ port: 8000 });

server.state('session', {
    ttl: 15 * 60 * 1000,  // 15 minutes
    isSecure: false,
    strictHeader: false,
    password: "hard_password"
});

server.prepareRoutes = function() {
    server.route({
        method: "POST",
        path: "/login",
        config: {
            state: {
                parse: 'true',
                failAction: 'log'
            },
            handler: handlers.login
        }
    });

    server.route({
        method: "POST",
        path: "/logout",
        handler: handlers.logout
    });

    server.route({
        method: "GET",
        path: "/users/{id?}",
        handler: handlers.getUsers
    });

    
    server.route({
        method: "DELETE",
        path: "/users/{id}",
        handler: handlers.deleteUsers
    });

    server.route({
        method: "POST",
        path: "/users",
        handler: handlers.postUsers
    });
    
    server.route({
        method: "POST",
        path: "/me/{movie_id}",
        handler: handlers.postMeMovies
    })

    server.route({
        method: "GET",
        path: "/me",
        handler: handlers.getMe
    })

    server.route({
        method: "POST",
        path: "/movies",
        handler: handlers.postMovies
    });

    server.route({
        method: "PUT",
        path: "/movies/{id}",
        handler: handlers.putMovies
    });

    server.route({
        method: "DELETE",
        path: "/movies/{id}",
        handler: handlers.deleteMovies
    });

    server.route({
        method: "GET",
        path: "/movies/{id?}",
        handler: handlers.getMovies 
    });
}

module.exports = server;