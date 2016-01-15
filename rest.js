var Hapi = require('hapi');
var addCorsHeaders = require('hapi-cors-headers');
var Joi = require('joi');
var handlers = require('./handlers.js');

var server = new Hapi.Server();
server.connection({ port: 80 });

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
            handler: handlers.login,
            state: {
                parse: 'true',
                failAction: 'log'
            },
            description: 'Logs the user in',
            notes: 'Logs the user in',
            tags: ['api'],
            validate: {
                payload: {
                    username: Joi.string()
                            .required()
                            .description('The name of a user'),
                    password: Joi.string()
                            .required()
                            .description('The password of a user')
                }
            }
        }
    });

    server.route({
        method: "POST",
        path: "/logout",
        config: {
            handler: handlers.logout,
            description: 'Logs the user out',
            notes: 'Logs the user out',
            tags: ['api']
        }
    });

    server.route({
        // Add listing movies of a specific user
        method: "GET",
        path: "/users/{id}",
        config: {
            handler: handlers.getSpecificUser,
            description: 'Gets a specific user',
            tags: ['api'],
            validate: {
                params: {
                    id: Joi.string()
                        .required()
                        .description('Id of a user')
                }
            }
        }
    });

    server.route({
        // Add listing movies of a specific user
        method: "GET",
        path: "/users",
        config: {
            handler: handlers.getUsers,
            description: 'Gets all users',
            tags: ['api'],
        }
    });

    server.route({
        method: "POST",
        path: "/users",
        config: {
            handler: handlers.postUsers,
            description: 'Registers a new user',
            notes: "Checks if given username already exists",
            tags: ['api'],
            validate: {
                payload: {
                    username: Joi.string()
                            .required()
                            .description('The name of a user'),
                    password: Joi.string()
                            .required()
                            .description('The password of a user')
                }
            }
        }
    });
    
    server.route({
        method: "DELETE",
        path: "/users/{user_id}",
        config: {
            handler: handlers.deleteUsers,
            description: "Deletes a user",
            notes: "Restricted only for admin",
            tags: ['api'],
            validate: {
                params: {
                    user_id: Joi.string()
                        .required()
                        .description("Id of a user")
                }
            }
        }

    });

    
    server.route({
        method: "POST",
        path: "/me/movies/{movie_id}",
        config: {
            handler: handlers.postMeMovies,
            description: "User adds a new movie to his collection",
            notes: "User must be logged in",
            tags: ['api'],
            validate: {
                params: {
                    movie_id: Joi.string()
                              .required()
                              .description("Id of a movie")
                }
            }
        }
    })

    server.route({
        method: "DELETE",
        path: "/me/movies/{movie_id}",
        config: {
            handler: handlers.deleteMeMovies,
            description: "User deletes a movie from his collection",
            notes: "User must be logged in",
            tags: ['api'],
            validate: {
                params: {
                    movie_id: Joi.string()
                              .required()
                              .description("Id of a movie")
                }
            }
        }
    })

    server.route({
        method: "GET",
        path: "/me/movies",
        config: {
            handler: handlers.getMeMovies,
            description: "User gets his own movie collection",
            tags: ['api']
        }
    })

    server.route({
        method: "GET",
        path: "/me",
        config: {
            handler: handlers.getMe,
            description: "User gets his own profile",
            tags: ['api']
        }
    })

    server.route({
        method: "POST",
        path: "/movies",
        config: {
            handler: handlers.postMovies,
            description: "Adds a new movie to the database",
            notes: "Restricted only for admin",
            tags: ['api'],
            validate: {
                payload: {
                    movie_name: Joi.string()
                               .required()
                               .description("The name of the movie"),
                    year: Joi.number()
                          .required()
                          .description("The year of the movie release")
                }
            }
        }
    });

    server.route({
        // todo
        method: "PUT",
        path: "/movies/{id}",
        config: {
            handler: handlers.putMovies,
            description: "Changes movie details",
            notes: "Restricted only for admin",
            tags: ['api'],
            validate: {
                params: {
                    id: Joi.number()
                        .required()
                        .description("Id of a movie")
                },
                payload: {
                    movieName: Joi.string()
                               .description("A new movie name"),
                    year: Joi.number()
                          .description("A new movie year")
                }
            }
        }
    });

    server.route({
        method: "DELETE",
        path: "/movies/{id}",
        config: {
            handler: handlers.deleteMovies,
            description: "Deletes a movie",
            notes: "Restricted only for admin",
            tags: ['api'],
            validate: {
                params: {
                    id: Joi.string()
                        .required()
                        .description("Id of a movie")
                }
            }
        }
    });

    server.route({
        method: "GET",
        path: "/movies/{id}",
        config: {
            handler: handlers.getSpecificMovie,
            description: "Gets details about a movie",
            tags: ['api'],
            validate: {
                params: {
                    id: Joi.string()
                        .required()
                        .description("Id of a movie")
                }
            }     
        }
    });

    server.route({
        method: "GET",
        path: "/movies",
        config: {
            handler: handlers.getMovies,
            description: "Gets all movies",
            tags: ['api'],
        }
    });
}

server.ext('onPreResponse', addCorsHeaders)

module.exports = server;
