const express = require("express");
const router = express.Router();
const User = require("../model/user.model");
const neo4j = require('neo4j-driver');
const redis = require("redis");
const redisClient = redis.createClient();

router.post('/', (req, res, next) => {
    var user = new User(req.body);
    const driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "Anturkar@05"));
    const session = driver.session();
    user.save(function(err, user){
        if (err) {
            res.json(err); 
            return console.error(err);
        }
        var id = user['_id'];
        
        const resultPromise = session.run('CREATE (u:USER {id:$id}) RETURN u',{id: String(id)});
        resultPromise.then(result => {
            session.close();
            driver.close();
            
            redisClient.set(user['name'], JSON.stringify(user), function(err, reply) {
                res.json({"message":"User added successfuly", user});
              });
             
            

        });
    });
});

module.exports = router; 
