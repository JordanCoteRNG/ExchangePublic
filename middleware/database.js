const mongoose = require("mongoose");
const connect = async  () => {
    try {
        const options = {
            useNewUrlParser: true,
        };
        const connections = await mongoose.connect('mongodb://mongo:27017/docker-db', options); //a debug
        if (connections) {
            console.log("Database connected successfully");
        }
    } catch (err) {
        console.log("Error while connecting to the database");
        console.log(err);
    }
};

module.exports = {
    connect,
};