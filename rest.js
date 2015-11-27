'use strict'

var Hapi = require('hapi');
var database = require('./database.js');
var passwordHash = require('password-hash');

var server = new Hapi.Server();
server.connection({ port: 8000 });

/*
server.state('data', {
    ttl: null,
    isSecure: true,
    isHttpOnly: true,
    encoding: 'base64json',
    clearInvalid: false, // remove invalid cookies
    strictHeader: true // don't allow violations of RFC 6265
});
*/

server.state('session', {
    ttl: 24 * 60 * 60 * 1000,     // One day
    isSecure: false,
    strictHeader: false,
});

server.prepareRoutes = function() {
    server.route({
        method: "POST",
        path: "/login",
        config: {
            state: {
                parse: 'false',
                failAction: 'log'
            },
            handler: function(request, reply) {
                console.log("POST /login")
                var name = request.payload.username;
                var pass = request.payload.password;
                if (name === undefined || pass === undefined) {
                    var return_object = { 
                        "code": 403, 
                        "message": "Missing username or password" 
                    }
                    reply(return_object).code(return_object.code);
                }
                else {
                    database.get("users", {username: name}, {}, function(data){
                        var return_object = {};
                        if (data[0] !== undefined) {
                            if (passwordHash.verify(pass, data[0].password)) {
                                return_object = { 
                                    code: 200, 
                                    message: "Login successful" 
                                }
                                var sessionId = Math.random().toString();
                                database.post("sessions", {"username": name, "sessionId": sessionId}, function(data) {
                                    reply(return_object).code(return_object.code).state("session", sessionId);
                                })
                            }
                            else {
                                return_object = { 
                                    code: 400, 
                                    message: "Wrong password" 
                                }
                                reply(return_object).code(return_object.code);
                            }
                        }
                        else {
                            return_object = { "code": 400, "message": "User doesn't exist" }
                            reply(return_object).code(return_object.code);
                        }
                    });
                }
            } 
        }
    });

    server.route({
        method: "POST",
        path: "/logout",
        config: {
            handler: function(request, reply) {
                reply({
                    code: 200,
                    message: "Logged out successfully"
                }).code(200)
            }
        }
    })

    server.route({
        method: "GET",
        path: "/users/{id?}",
        config: {
            handler: function(request, reply) {
                console.log(request.state)
                console.log("GET /users")
                database.get("users", {}, {username: 1}, function(data){
                    var return_object = {
                        count: data.length,
                        users: data
                    }
                    reply(return_object).code(200);
                });  
            }
        }
    });

    server.route({
        method: "POST",
        path: "/users",
        handler: function(request, reply) {
            console.log("POST /users")
            var name = request.payload.username;
            var pass = request.payload.password;
            if (name === undefined || pass === undefined) {
                var return_object = {
                    "code": 403,
                    "message": "Missing username or password"
                }
                reply(return_object).code(return_object.code);
            }
            else {
                var password = passwordHash.generate(pass);
                var return_object = {};
                database.get("users", {"username": name}, {}, function(data){
                    if (data[0] !== undefined) {
                        return_object = { 
                            code: 409, 
                            "message": "User with given username already exists" 
                        }
                        reply(return_object).code(return_object.code);
                    }
                    else {
                        database.post("users", {"username": name, "password": password}, function(data){
                            return_object = { 
                                code: 201,
                                message: "New user created"
                            }
                            reply(return_object).code(return_object.code);
                        });
                    }
                })
            }
        }
    });

    /*
    server.route({
        method: "DELETE",
        path: "/users/{id}",
        handler: function(request, reply) {
            console.log("DELETE /users/{id}")
            if (hasAccess) {
                var id = request.params.id;
                database.delete("users", {"_id": id}, function(data){
                    var return_object = {
                        count: data.length,
                        users: data
                    }
                    reply(return_object).code(200);
                });
            }
            else {
                var return_object = {
                    code: 401,
                    message: "No access"
                }
                reply(return_object).code(401);
            }
        }
    });
*/
   

    server.route({
        method: "POST",
        path: "/movies",
        handler: function(request, reply) {
            console.log("POST /movies")
            if (hasAccess) {
                var name = request.payload.username;
                var year = request.payload.year;
                if (name === undefined || year === undefined) {
                    var return_object = {
                    "code": 403,
                    "message": "Missing name of year"
                    }
                    reply(return_object).code(403);
                }
                else {
                    database.post("movies", {"username": name, "year": year}, function(data){
                        var return_object = {
                            count: data.length,
                            users: data
                        }
                        reply(return_object).code(201);
                    });
                }
            }
        }
    });

    server.route({
        method: "PUT",
        path: "/movies/{id}",
        handler: function(request, reply) {
            console.log("PUT /movies/{id}")
            if (hasAccess) {
                var id = request.params.id;
                var name = request.payload.username;
                var year = request.payload.year;
                
                var query = {};
                var good_request = false;

                if (name !== undefined && year === undefined) {
                    query = {"username": name};
                    good_request = true;
                }
                else if (name === undefined && year !== undefined) {
                    query = {"year": year};
                    good_request = true;
                }
                else if (name !== undefined && year !== undefined) {
                    query = {"username": name, "year": year};
                    good_request = true;
                }
                if (good_request) {
                    database.put("movies", id, query, function(data) {
                        var return_object = {
                            count: data.length,
                            movies: data
                        }
                        reply(return_object).code(200);
                    })
                }
                else {
                    var return_object = {
                        code: 400,
                        message: "Nothing given in body"
                    }
                    reply(return_object).code(400);
                }
            }
        }
    });

    server.route({
        method: "DELETE",
        path: "/movies/{id}",
        handler: function(request, reply) {
            console.log("DELETE /users/{id}")
            if (hasAccess) {
                var id = request.params.id;
                database.delete("movies", {"_id": id}, function(data){
                    var return_object = {
                        count: data.length,
                        users: data
                    }
                    reply(return_object).code(200);
                });
            }
            else {
                var return_object = {
                    code: 401,
                    message: "No access"
                }
                reply(return_object).code(401);
            }
        }
    });

    server.route({
        method: "GET",
        path: "/movies/{id?}",
        handler: function(request, reply) {
            console.log("GET /movies/{id?}")
            if (request.params.id) {
                var id = request.params.id;
                database.get("movies", {"_id": id}, function(data){
                    if (data.length > 0)
                        reply(data[0]).code(200);
                    else {
                        var return_object = {
                            code: 404,
                            message: "movie not found"
                        }
                        reply(return_object).code(404);
                    }
                }); 
            }
            else {
                database.get("movies", {}, function(data){
                    var return_object = {
                        count: data.length,
                        movies: data
                    }

                    reply(return_object).code(200);
                });
            }
        }
    });
}

module.exports = server;