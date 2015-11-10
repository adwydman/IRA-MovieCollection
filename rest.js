var Hapi = require('hapi');
var database = require('./database.js')

var server = new Hapi.Server();
server.connection({ 
    host: 'localhost', 
    port: 8000
});

var hasAccess = true;

server.prepareRoutes = function() {

    server.route({
        method: "GET",
        path: "/users/{id?}",
        handler: function(request, reply) {
            console.log("GET /users/{id?}")
            if (request.params.id && hasAccess) {
                var id = request.params.id;
                database.get("users", {"_id": id}, function(data){
                    if (data.length > 0) 
                        reply(data[0]).code(200);
                    else {
                        var return_object = {
                            code: 404,
                            message: "User not found"
                        }
                        reply(return_object).code(404);
                    }
                }); 
            }
            else {
                database.get("users", {}, function(data){
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
            var name = request.payload.name;
            database.get("users", {"name": name}, function(data){
                if (data[0] != undefined) {
                    reply({"register": "rejected"}).code(403);
                }
                else {
                    database.post("users", {"name": name}, function(data){
                        var return_object = {
                            count: data.length,
                            users: data
                        }
                        reply(return_object).code(201);
                    });
                }
            })

        }
    });

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

    server.route({
        method: "POST",
        path: "/login",
        handler: function(request, reply) {
            console.log("POST /login")
            var name = request.payload.name;
            database.get("users", {"name": name}, function(data){
                if (data[0] !== undefined)
                    reply({"login": "successful"}).code(200);
                else
                    reply({"login": "rejected"}).code(401);
            });
        }
    });

    server.route({
        method: "POST",
        path: "/movies",
        handler: function(request, reply) {
            console.log("POST /movies")
            if (hasAccess) {
                var name = request.payload.name;
                var year = request.payload.year;
                console.log(request.payload)
                console.log(year)
                database.post("movies", {"name": name, "year": year}, function(data){
                    var return_object = {
                        count: data.length,
                        users: data
                    }
                    reply(return_object).code(201);
                });
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
                var name = request.payload.name;
                var year = request.payload.year;
                
                var query = {};
                var good_request = false;

                if (name !== undefined && year === undefined) {
                    query = {"name": name};
                    good_request = true;
                }
                else if (name === undefined && year !== undefined) {
                    query = {"year": year};
                    good_request = true;
                }
                else if (name !== undefined && year !== undefined) {
                    query = {"name": name, "year": year};
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