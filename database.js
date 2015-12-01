var mongo = require('mongodb');
var MongoClient = require('mongodb').MongoClient;

var database = function() {}

var removeDocument = function(db, query, collection_name, callback) {
    var collection = db.collection(collection_name);
    if (query["_id"] !== undefined) 
        query["_id"] = new mongo.ObjectID(query["_id"]);

    collection.remove(query, function(err, result) {
        if(err){
            result = err;
            result.type = "error";
        }
        else {
            result.type = "success";
        }

        callback(result);
    });    
}

var insertDocuments = function(db, query, collection_name, callback) {
    var collection = db.collection(collection_name);
    collection.insert(query, function(err, result) {
        if (err) {
            result = err;
            result.type = "error"
        }
        else {
            result.type = "success";
        }

        callback(result);
    })
}

var findDocuments = function(db, query, options, collection_name, callback) {
    var collection = db.collection(collection_name);
    if (query["_id"] !== undefined){
        try {
            query["_id"] = new mongo.ObjectID(query["_id"]);
        }
        catch (e) {}
    }
    
    collection.find(query, options).toArray(function(err, result) {
        if (err) {
            result = err;
            result.type = "error";
        }
        else {
            result.type = "success";
        }

        callback(result);
    });      
}

var updateDocument = function(db, id, query, collection_name, callback) {
    var collection = db.collection(collection_name);
    id = new mongo.ObjectId(id);
    collection.update({"_id": id}, {$set: query}, function(err, result) {
        if (err) {
            result = err;
            result.type = "error";
        }
        else {
            result.type = "success";
        }

        callback(result);
    })
}


var url = 'mongodb://localhost:27017/projekt_rest';
database.post = function (collection, query, callback) {
    MongoClient.connect(url, function(err, db) {
        insertDocuments(db, query, collection, function(result) {
            callback(result);
            db.close();    
        })
    });
}

database.get = function (collection, query, options, callback) {
    MongoClient.connect(url, function(err, db) {
        findDocuments(db, query, options, collection, function(result) {
            callback(result);
            db.close();    
        });
    });
}

database.put = function(collection, resource_id, query, callback) {
    MongoClient.connect(url, function(err, db) {
        updateDocument(db, resource_id, query, collection, function(result) {
            callback(result);
            db.close();
        })
    })
}

database.delete = function (collection, query, callback) {
    MongoClient.connect(url, function(err, db) {
        removeDocument(db, query, collection, function(result) {
            callback(result);
            db.close();
        });
    });
}

module.exports = database;