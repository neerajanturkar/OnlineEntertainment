const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const redis = require("redis")
const neo4j = require('neo4j-driver');
const apriori = require('apriori');

const app = express();
const PORT = 5000;
const redisClient = redis.createClient();

const user = require("./api/user");
const tile = require("./api/tile")

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use('/api/tile/', tile); 
app.use('/api/user', user);
const driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "Anturkar@05"));
const session = driver.session();


mongoose.connect('mongodb://localhost:27017/online_entertainment');
mongoose.connection.on('connected', () => {
    console.log("Mongodb connected");
});
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost"); 
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

redisClient.on('connect', function() {
    console.log('Redis connected');
});

// redisClient.scan('0','MATCH','an*','COUNT','100',(err, reply) => {
//     console.log(reply[1].length);
//     // for (var name : reply[1]){
//     //     // console.log(name.name);
//     // }
//     for (var i = 0; i < reply[1].length; i++) {
//         console.log(reply[1][i]);
//         //Do something
//         redisClient.get(reply[1][i],(err2,reply2) => {
//             console.log(reply2);
//         });
//     }
// })
let transactions = [
    [1,3,4],
    [2,3,5],
    [1,2,3,5],
    [2,5],
    [1,2,3,5]
];
var result = new apriori.Algorithm(0.15, 0.6, false).showAnalysisResultFromFile('dataset.csv');
console.log(" hi"  +result);
app.listen(PORT, () => console.log(`Server started on ${PORT}`));