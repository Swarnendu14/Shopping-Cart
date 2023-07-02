const express = require('express');
const userController = require('../controllers/userController')
const mid= require('../middlewares/auth');
const Router=express.Router();

Router.post('/aws',userController.uploadFile);
Router.post('/register',userController.regUser);
Router.post('/login',userController.login);
Router.get("/user/:userId/profile", mid.authentication, mid.authorization, userController.getUserbyId);
Router.put("/user/:userId/profile", mid.authentication, mid.authorization, userController.updateUser);

module.exports =Router;