const express = require("express");
const router = express.Router();
const User = require("../model/user.model");
const neo4j = require('neo4j-driver');
const redis = require("redis");
const redisClient = redis.createClient();

router.post('/', adduser);
router.get('/', getUserFromRedis, getUserFromMongo);


function adduser(req, res, next) {
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
    
module.exports = router; 
