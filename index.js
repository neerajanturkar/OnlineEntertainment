const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const redis = require("redis")
const neo4j = require('neo4j-driver');

const app = express();
const PORT = 5000;
const redisClient = redis.createClient();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

const driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("neo4j", "Anturkar@05"));
const session = driver.session();


mongoose.connect('mongodb://localhost:27017/reale');
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
app.listen(PORT, () => console.log(`Server started on ${PORT}`));