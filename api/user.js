const express = require("express");
const router = express.Router();
const User = require("../model/user.model");
const Tile = require("../model/tile.model");
const neo4j = require('neo4j-driver');
const redis = require("redis");
const redisClient = redis.createClient();

router.post('/', addUser);
router.get('/', getUserFromRedis, getUserFromMongo);
router.post('/addRelation', addRelation);
router.put('/',updateUser);


function addUser(req, res, next) {
    var user = new User(req.body);
    const driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "Anturkar@05"));
    const session = driver.session();
    user.save(function(err, user){
        if (err) {
            res.json(err); 
            return;
        }
        var id = user['_id'];
        
        const resultPromise = session.run('CREATE (u:USER {id:$id}) RETURN u',{id: String(id)});
        resultPromise.then(result => {
            session.close();
            driver.close();
            
            redisClient.set(user['email'], JSON.stringify(user), function(err, reply) {
                res.json({"message":"User added successfuly", user});
              });
        });
    });
}
function getUserFromRedis(req, res, next ) {
    redisClient.get(req.query['email'], (err, reply) => {
        if(err) next();
        
        if(reply){ 
            res.status(200).json({"success": true, "user":JSON.parse(reply), "message": "Fetcehd from redis"});
            return;
        } else {
            next();
        }
    });
}
function getUserFromMongo(req, res, next) {
    User.findOne({email: req.query['email']}).exec((err, user) => {
        if(user){
            res.json({"success": true , "user":user,"message": "Fetched from mongodb"});
        } else{
            res.json({"success": false ,"message": "User not found"});
        }
    });
}

function addRelation(req, res, next) {
    const driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "Anturkar@05"));
    const session = driver.session();
    var email = req.body.email;
    var tile = req.body.tile;
    var like = req.body.like; 
    
    User.findOne({email: email}).exec((err, foundUser) => {  
        if(err) res.json({"success": false, "message" : err});      
        if(foundUser) {
            Tile.findOne({tile: tile}).exec((err, foundTile) =>  {
                if(err) res.json({"success": false, "message" : err});      
                if(foundTile) {
                    userId = foundUser['_id'];
                    tileId = foundTile['_id'];
                    
                    const resultPromise = session.run('MATCH (u:USER),(t:TILE) WHERE u.id = $userId AND t.id = $tileId CREATE (u)-[r:WATCHED {like:$like} ]->(t) RETURN r',{userId: String(userId), tileId: String(tileId), like: String(like)});
                    resultPromise.then(result => {
                        session.close();
                        driver.close();
                        res.json({"success": true, "message" : "Added relationship successfully"})
                    });
                } else {
                    res.json({"success": false, "message" : "No tile with name " + tile + " found"})
                }
            });
        } else {
            res.json({"success": false, "message" : "No user with email " + email + " found"});
        }
    });
    
    
}
function updateUser(req, res, next) {
    userId = req.body.userId,
    name = req.body.name,
    email = req.body.email,
    dob = req.body.dob,
    preferedGeners = req.body.preferedGeners

    var getUserValue = function getUser(){
        redisClient.get(user['name'], JSON.stringify(user), function(err, reply){
            res.json({user});
        });
    }

    console.log(getUserValue);
    if (getUserValue == getUserValue){
        redisClient.flushdb(User['name'], JSON.stringify(user), function(err, reply){
            res.json({"message":"User deleted successfuly from redis"});
        });
    }

    const driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "Neo4j"));
    const session = driver.session();
    User.findByIdAndUpdate(UserId, {$set:{
    UserId: UserId,
    name: name,
    email: email,
    dob: dob,
    preferedGeners: preferedGeners,
    }}, function(err, user){
        if (err) {
            res.json(err);
            return console.error(err);
        }
                redisClient.set(user['name'].toLowerCase(), JSON.stringify(user), function(err, reply){
                    res.json({"message":"User updated Successfuly", user});
                });
    });
}   
module.exports = router;

