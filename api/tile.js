const express = require("express");
const router = express.Router();
const Tile = require("../model/tile.model");
const neo4j = require('neo4j-driver');
const redis = require("redis");
const redisClient = redis.createClient();

router.post('/create', addTile);
router.get('/', getTilesFromRedis, getTilesFromMongo);

function addTile(req, res, next) {
    var tile = new Tile(req.body);
    const driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "neo5j"));
    const session = driver.session();
    tile.save(function(err, tile){
        if (err) {
            res.json(err); 
            return console.error(err);
        }
        var id = tile['_id'];
        
        const resultPromise = session.run('CREATE (t:TILE {id:$id , tile:$tile}) RETURN t',{id: String(id), tile: tile['tile']});
        resultPromise.then(result => {
            session.close();
            driver.close();
            
            redisClient.set(tile['tile'].toLowerCase(), JSON.stringify(tile), function(err, reply) {
                res.json({"message":"Tile created successfuly", tile});
              });
        });
    });
}

function getTilesFromRedis(req, res, next){
    if (req.query['search'] == undefined ) res.json({"success": false, "message": "search string cannot be null"});
    if (req.query['cached'] === 'false') {
        next();
    } else {    
        search = req.query['search'] + "*";    
        redisClient.scan('0', 'MATCH', search.toLowerCase(), 'COUNT', '100',(err, reply) => {
                if(reply[1].length > 0 ) {
                    var tiles = [];
                    for (var i = 0; i < reply[1].length; i++) {
                        tiles.push(reply[1][i]);   
                    }    
                    redisClient.mget(tiles,(err2,reply2) => {
                        result = '[' + reply2 + ']';
                        tiles = JSON.parse(result);
                        res.json({"success": true, "tiles": tiles , "message": "Tiles fetched from redis"});

                    });

                } else {
                    next();
                }

            })
    }
}
function getTilesFromMongo(req, res, next){

    Tile.find({'tile': new RegExp(req.query['search'], 'i') }, (err, tiles) => {
        if(err) res.json({"success": false, "message": err});
        if(tiles.length > 0)
            res.json({"success": true, "tiles": tiles , "message": "Tiles fetched mongodb"});
        else
            res.json({"success": false, "message": "No tiles found"});
    });
}

router.post('/update', (req, res, next) => {
        tileId = req.body.tileId,
        tile = req.body.tile,
        type = req.body.type,
        description = req.body.description,
        publishedOn = req.body.publishedOn,
        duration = req.body.duration,
        genere = req.body.genere

        var getTileValue = function getTile(){
            redisClient.get(tile['tile'], JSON.stringify(tile), function(err, reply) {
                res.json({tile});
            });
        }
        // console.log(getTile().value);
    
        console.log(getTileValue);
        if (getTileValue == getTileValue){
            redisClient.flushdb(tile['tile'], JSON.stringify(tile), function(err, reply) {
                res.json({"message":"Tile deleted successfuly from redis"});
            });
        }

        const driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "neo5j"));
        const session = driver.session();
        Tile.findByIdAndUpdate(tileId, {$set:{
        tileId: tileId,
        tile: tile, 
        type: type,
        description: description,
        publishedOn : publishedOn,
        duration : duration,
        genere : genere,
        }}, function(err, tile){
            if (err) {
                res.json(err); 
                return console.error(err);
            }
           // var id = tile['_id'];              
                    redisClient.set(tile['tile'].toLowerCase(), JSON.stringify(tile), function(err, reply) {
                        res.json({"message":"Tile updated successfuly", tile});
                    });
        })
    });
    
module.exports = router; 
