const express = require('express');
const mongoose = require('mongoose');
const route = require('./routes/route');
const dotenv = require('dotenv').config()
const { PORT, MONGOOSE_STRING } = process.env;
const app = express()
const multer = require("multer");
const { AppConfig } = require('aws-sdk');


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(multer().any())

mongoose.connect(MONGOOSE_STRING, { usenewurlparser: true })
    .then(() => console.log('connected to mongooDB'))
    .catch((err) => console.log(err.message));

app.use('/', route);

app.listen(PORT, () => {
    console.log('express running on port', PORT)
})