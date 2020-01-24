const express = require("express");
const router = express.Router();
const Tile = require("../model/tile.model");
const neo4j = require('neo4j-driver');
const redis = require("redis");
const redisClient = redis.createClient();

router.post('/create', (req, res, next) => {
    var tile = new Tile(req.body);
    const driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "neo5j"));
    const session = driver.session();
    tile.save(function(err, user){
        if (err) {
            res.json(err); 
            return console.error(err);
        }
        var id = tile['_id'];
        
        const resultPromise = session.run('CREATE (t:TILE {id:$id}) RETURN t',{id: String(id)});
        resultPromise.then(result => {
            session.close();
            driver.close();
            
            redisClient.set(tile['tile'], JSON.stringify(user), function(err, reply) {
                res.json({"message":"Tile created successfuly", tile});
              });
        });
    });
});

module.exports = router; 
