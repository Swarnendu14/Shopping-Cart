const express = require('express');
const bodyParser = require('body-parser');
const mongoose= require('mongoose');
require('dotenv').config()
const {PORT,mongoURL} = process.env;
const route=require('./routes/route');

const app= express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect(mongoURL,{useNewUrlParser:true})
.then(()=>console.log("MongoDB is connected"))
.catch((err)=>console.log(err.message))

app.use("/",route);

let port =PORT||3000;
app.listen(port,()=>console.log("App is running on port: " + port));



