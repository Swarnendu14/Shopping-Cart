const jwt = require("jsonwebtoken");
const userModel = require("../model/userModel");
const { isValidId } = require("../utils/validator");
const dotenv = require('dotenv').config()
const { SECRET_KEY } = process.env;


//athentication

const authenticate = function(req, res, next) {
    try {
        let token = req.headers.authorization;
        token = token.replace("Bearer", "").trim()

        if (!token) return res.status(401).send({ status: false, message: "Please provide token" })
        let decodedToken = jwt.verify(token, SECRET_KEY)
        req.decodedToken = decodedToken
        next()
    } catch (error) {
        if (error.message == "Invalid token") {
            return res.status(401).send({ status: false, message: "Enter valid token" })
        }
        return res.status(500).send({ status: false, message: error.message })
    }
};

//authorisation

const authorisation = async function(req, res, next) {
    try {
        let decodedToken = req.decodedToken
        if (req.params.userId) {
            if (!isValidId(req.params.userId)) {
                return res.status(400).send({
                    status: false,
                    message: "Please provide valid UserId for details",
                });
            }
            let user = await userModel.findById(req.params.userId)
            if (!user) return res.send({ status: false, message: "There is no user with this Id" })
                // console.log(decodedToken)
            if (user._id != decodedToken.id) return res.status(403).send({ status: false, message: "Unauthorised" })
            next()
        }
    } catch (error) {
        console.log(error);
        return res.status(500).send({ message: error.message });
    }
};

module.exports = { authenticate, authorisation };