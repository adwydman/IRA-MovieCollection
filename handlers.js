var database = require('./database.js');
var passwordHash = require('password-hash');

var movieExists = function(array, movie_id) {
    for (var i = 0; i < array.length; i++) {
        if (array[i].movie_id === movie_id)
            return true;
    }
    return false;
}


var handlers = {
    login: function(request, reply) {
		console.log("POST /login");
        if (request.state.session) {
            var return_object = {
                code: 200,
                message: "You are logged in"
            }
            reply(return_object).code(return_object.code);
        }
        else {
            if (request.payload === null || request.payload.username === undefined || request.payload.password === undefined) {
                var return_object = { 
                    code: 403, 
                    message: "Missing username or password" 
                };
                reply(return_object).code(return_object.code);
            }

            else {
                var name = request.payload.username;
                var pass = request.payload.password;
                database.get("users", {username: name}, {}, function(data){
                    var return_object = {};
                    if (data[0] !== undefined) {
                        if (passwordHash.verify(pass, data[0].password)) {
                            return_object = { 
                                code: 200, 
                                message: "Login successful" 
                            }
                            var session_id = Math.random().toString();
                            database.post("sessions", {"user_id": data[0]["_id"], "username": name, "session_id": session_id}, function(data) {
                                reply(return_object).code(return_object.code).state('session', session_id);
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
	},

	logout: function(request, reply) {
		console.log("POST /logout")
		var return_object = { 
            code: 200, 
            message: "Logged out successfully" 
        }
        reply(return_object).code(return_object.code).unstate('session');
	},

    getSpecificUser: function(request, reply) {
        console.log("GET /users/{id}");
        var user_id = request.params.id;
        database.get("users", {"_id": user_id}, {password: 0}, function(data) {
            var user_details = data[0];
            database.get("users_and_movies", {"username": user_details.username}, {"_id": 0, "username": 0}, function(result) {
                var return_object = {
                    code: 200,
                    user_id: user_id,
                    username: user_details.username,
                    movies_count: result.length,
                    movies: result
                }
                reply(return_object).code(return_object.code);
            });
        });
    },

    getUsers: function(request, reply) {
        console.log("GET /users")
        database.get("users", {}, {password: 0}, function(data){
            var return_object = {
                code: 200,
                count: data.length,
                users: data
            }
            reply(return_object).code(return_object.code);
        });  
    },

    postUsers: function(request, reply) {
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
                    database.post("users", {"username": name, "password": password}, function(result){
                        return_object = { 
                            code: 201,
                            message: "New user created",
                            data: result.ops[0]
                        }
                        reply(return_object).code(return_object.code);
                    });
                }
            })
        }
    },

    deleteUsers: function(request, reply) {
        console.log("DELETE /users/{user_id}")
        if (request.state.session) {
            var user_id = request.params.user_id;
            var session_id = request.state.session;
            database.get("sessions", {"session_id": session_id}, {}, function(data) {
                var user_details = data[0];
                if (user_details.username === "admin") {
                    database.get("users", {"_id": user_id}, {}, function(result) {
                        if (result.length === 0) {
                            var return_object = {
                                code: 404, 
                                message: "User not found"
                            }
                            reply(return_object).code(return_object.code);
                        }
                        else {
                            database.delete("users", {"_id": user_id}, function(deletion){
                                var return_object = {
                                    code: 200,
                                    message: "User has been deleted"
                                }
                                reply(return_object).code(return_object.code);
                            });
                        }
                    });
                }
                else {
                    var return_object = {
                        code: 403,
                        message: "No access"
                    }
                    reply(return_object).code(return_object.code)
                } 
            })
        }
        else {
            var return_object = {
                code: 401,
                message: "You are not logged in"
            }
            reply(return_object).code(return_object.code)
        }
    },


	postMeMovies: function(request, reply){
        console.log("POST /me/movies/{movie_id}");
        if (request.state.session) {
            var session_id = request.state.session;
            var movie_id = request.params.movie_id;
            database.get("sessions", {"session_id": session_id}, {}, function(data) {
                var user_details = data[0];
                database.get("movies", {"_id": movie_id}, {}, function(result_movies) {
                    var movie_name = result_movies[0].name;
                    database.get("users_and_movies", {"username": user_details.username, "movie_id": movie_id, "movie_name": movie_name}, {}, function(data) {
                        if (data.length !== 0) {
                            var return_object = {
                                code: 409, // conflict
                                message: "This movie has already been assigned"
                            }
                            reply(return_object).code(return_object.code);
                        }
                        else {
                            database.post("users_and_movies", {"username": user_details.username, "movie_id": movie_id, "movie_name": movie_name}, function(result) {
                            	var return_object = {
                            		code: 201,
                            		message: "Movie has been linked to the user"
                            	}
                            	reply(return_object).code(return_object.code);
                            })
                        }
                    })
                })
            });
        }
        else {
            var return_object = {
                code: 401,
                message: "You are not logged in"
            }
            reply(return_object).code(return_object.code);
        }
    },

    deleteMeMovies: function(request, reply) {
        console.log("/DELETE /me/movies/{movie_id}");
        var movie_id = request.params.movie_id;
        if (request.state.session) {
            var session_id = request.state.session;
            database.get("sessions", {"session_id": session_id}, {}, function(data) {
                var user_details = data[0];
                database.get("users_and_movies", {"username": user_details.username}, {"_id": 0, "username": 0}, function(result) {
                    if (movieExists(result, movie_id)) {
                        database.delete("users_and_movies", {"username": user_details.username, movie_id: movie_id}, function(deletion) {
                            var return_object = {
                                code: 204, 
                                message: "Movie has been successfully deleted"
                            }
                            reply(return_object).code(return_object.code);
                        })
                    }
                    else {
                        var return_object = {
                            code: 404,
                            message: "Movie not found"
                        }
                        reply(return_object).code(return_object.code);
                    }
                });
            });
        }
        else {
            var return_object = {
                code: 401,
                message: "You are not logged in"
            }
            reply(return_object).code(return_object.code);  
        }
    },

    getMe: function(request, reply) {
        console.log("GET /me");
        if (request.state.session) {
            var session_id = request.state.session;
            database.get("sessions", {"session_id": session_id}, {}, function(data) {
                var user_details = data[0];
                database.get("users", {"username": user_details.username}, {"_id": 0, "username": 0}, function(result) {
                    var return_object = {
                        code: 200,
                        user_id: user_details.user_id,
                        username: user_details.username,
                    }
                    reply(return_object).code(return_object.code);
                })
            })
        }
        else {
            var return_object = {
                code: 401,
                message: "You are not logged in"
            }
            reply(return_object).code(return_object.code);
        }
    },
    
    getMeMovies: function(request, reply) {
        console.log("GET /me/movies");
        if (request.state.session) {
            var session_id = request.state.session;
            database.get("sessions", {"session_id": session_id}, {}, function(data) {
                var user_details = data[0];
                database.get("users_and_movies", {"username": user_details.username}, {"_id": 0, "username": 0}, function(result) {
                    var return_object = {
                        code: 200,
                        user_id: user_details.user_id,
                        username: user_details.username,
                        movies_count: result.length,
                        movies: result
                    }
                    reply(return_object).code(return_object.code);
                })
            })
        }
        else {
            var return_object = {
                code: 401,
                message: "You are not logged in"
            }
            reply(return_object).code(return_object.code);
        }
    },

    getSpecificMovie: function(request, reply) {
        console.log("GET /movies/{id}")
        var id = request.params.id;
        database.get("movies", {"_id": id}, {}, function(data){
            if (data.length > 0) {
                var return_object = {
                    code: 200,
                    data: data[0]
                }
                reply(return_object).code(return_object.code);
            }
            else {
                var return_object = {
                    code: 404,
                    message: "Movie not found"
                }
                reply(return_object).code(return_object.code);
            }
        }); 
    },

    getMovies: function(request, reply) {
        console.log("GET /movies")
        database.get("movies", {}, {}, function(data){
            var return_object = {
                code: 200,
                movies_count: data.length,
                movies: data
            }
            reply(return_object).code(return_object.code);
        });
    },

    postMovies: function(request, reply) {
        console.log("POST /movies");
        // todo: dodać walidację payloadu
        if (request.state.session) {
            var session_id = request.state.session;
            database.get("sessions", {"session_id": session_id}, {}, function(data) {
                var user_details = data[0];
                if (user_details.username === "admin") {
                    var name = request.payload.movieName;
                    var year = request.payload.year;
                    var return_object = {};
                    if (name === undefined || year === undefined) {
                        return_object = { 
                            code: 403, 
                            message: "Missing name or year" 
                        }
                        reply(return_object).code(return_object.code);
                    }
                    else {
                        database.get("movies", {"movie_name": name}, {}, function(result) {
                            if (result[0] !== undefined) {
                                var return_object = { 
                                    code: 409, 
                                    "message": "Movie with given name already exists" 
                                }
                                reply(return_object).code(return_object.code);
                            }
                            else {
                                database.post("movies", {"movie_name": name, "year": year}, function(result){
                                    return_object = { 
                                        code: 201, 
                                        message: "Movie has been successfully added",
                                        data: result.ops[0]
                                    }
                                    reply(return_object).code(return_object.code);
                                });
                            }
                        })
                    }
                }
                else {
                    var return_object = {
                        code: 403,
                        message: "No access"
                    }
                    reply(return_object).code(return_object.code)
                }
            })
        }
        else {
            var return_object = {
                code: 401,
                message: "You are not logged in"
            }
            reply(return_object).code(return_object.code)
        }
    },

    putMovies: function(request, reply) {
        console.log("PUT /movies/{movie_id}")
        if (request.state.session) {
        	var session_id = request.state.session;
        	var movie_id = request.params.movie_id;
        	database.get("sessions", {"session_id": session_id}, {}, function(data) {
        		var user_details = data[0];
        		if (user_details.username === "admin") {
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
                        database.get("movies", {"_id": movie_id}, {}, function(result) {
                            if (result.length !== 0) {
        		                database.put("movies", id, query, function() {
        		                    var return_object = {
        		                    	code: 200,
        		                        message: "Movie has been updated"
        		                    }
        		                    reply(return_object).code(return_object.code);
        		                });
                            }
                            else {
                                var return_object = {
                                    code: 404, 
                                    message: "Movie was not found"
                                }
                                reply(return_object).code(return_object.code);
                            }
                        })
		            }
		            else {
		                var return_object = {
		                    code: 400,
		                    message: "Wrong body"
		                }
		                reply(return_object).code(return_object.code);
		            }
        		}
        		else {
                    var return_object = {
                        code: 403,
                        message: "No access"
                    }
                    reply(return_object).code(return_object.code)
        		}
        	})
        }
        else {
        	var return_object = {
                code: 401,
                message: "You are not logged in"
            }
            reply(return_object).code(return_object.code)
        }
    },

    deleteMovies: function(request, reply) {
        console.log("DELETE /movies/{id}")
        if (request.state.session) {
        	var session_id = request.state.session;
        	database.get("sessions", {"session_id": session_id}, {}, function(data) {
        		var user_details = data[0];
        		if (user_details.username === "admin") {
		            var id = request.params.id;
		            database.delete("movies", {"_id": id}, function(){
		                var return_object = {
                            code: 204,
		                    message: "Movie has been deleted"
		                }
		                reply(return_object).code(return_object.code);
		            });
        		}
        	}) 
        }
        else {
            var return_object = {
                code: 401,
                message: "You are not logged in"
            }
            reply(return_object).code(return_object.code);
        }
    },

    

}

module.exports = handlers;