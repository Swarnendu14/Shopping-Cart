const validator = require('validator');
const userModel= require('../models/userModel');
const jwt = require('jsonwebtoken');
const awsFile= require('./aws');
const bcrypt = require('bcrypt');
require('dotenv').config()
const {secretMsg}=process.env;
let profileImage;

const uploadFile= async (req,res)=>{
    try{
        let files = req.files
        if (files && files.length > 0) {
            let uploadUrl = await uploadFile(files[0])
            profileImage = uploadUrl
        }
        else {
            return res.status(400).send({ status: false, message: "Please Provide Image File" })
        }
        return res.status(200).send({ status:true,modules:" profileImage is stored in aws"});
    }
    catch(err){
        return res.status(500).send({status:false,message:err.message});
    }
}
const regUser = async (req, res) => {
    try {
        let { fname, lname, email, password, phone, address } = req.body;
        if (!fname || !lname || !email || !password || !phone || !address) {
            return res.status(400).json({ status: false, message: 'Please enter all required fields.' });
        }
        let uemail = await userModel.findOne({ email: email });
        if (uemail) {
            return res.status(400).json({ status: false, message: 'Email is already registered.' });
        }
        if (!(validator.isEmail(email))) {
            return res.status(400).json({ status: false, message: 'Please enter a valid email address.' });
        }

        if (!(password.length >= 8 && password.length <= 15)) {
            return res.status(400).json({ status: false, message: 'Please enter a valid password.' });
        }

        let uphone = await userModel.findOne({ phone: phone });
        if (uphone) {
            return res.status(400).json({ status: false, message: 'phone number is already registered.' });
        }
        if (phone.length != 10 && !(/^[6-9]{1}[0-9]{9}$/.test(phone))) {
            return res.status(400).json({ status: false, message: 'Please give valid phone number.' })
        }

        if (!(address.shipping) || !(address.billing) || !(address.billing.street) || !(address.billing.city) || !(address.billing.pincode) || !(address.shipping.street) || !(address.shipping.city) || !(address.shipping.pincode)) {
            return res.status(400).json({ status: false, message: 'Please enter all required fields.' });
        }
        if (!(/^[1-9][0-9]{5}$/.test(address.billing.pincode)) && !(/^[1-9][0-9]{5}$/.test(address.shipping.pincode))) {
            return res.status(400).json({ status: false, message: "Enter valid pincode" });
        }
    
        
        let hashPassword = await bcrypt.hash(password, password.length)
        password = hashPassword;

        let data = { fname, lname, email, profileImage, password, phone, address };
        let userReg = await userModel.create(data);
        return res.status(200).json({ status: true, message: 'User created successfully', data: userReg });
    }
    catch (err) {
        return res.status(500).json({ status: false, message: err.message });
    }
}
const login = async (req, res) => {
    try {
        let { email, password } = req.body;
        if (!(validator.isEmail(email))) {
            return res.status(400).json({ status: false, message: 'Please enter a valid email address.' });
        }

        let findEmail = await userModel.findOne({ email: email });
        if (!findEmail) {
            return res.status(400).json({ status: false, message: 'Email is not registered' });
        }
        

        if (!(password.length >= 8 && password.length <= 15)) {
            return res.status(400).json({ status: false, message: 'Please enter a valid password.' });
        }


        let checkPassword = await bcrypt.compare(password, findEmail.password)
        if (!checkPassword) {
            return res.status(400).send({ status: false, message: "Incorrect Password" });
        }

        let token = jwt.sign({ userId: findEmail._id },secretMsg, { expiresIn: '1d' });
        return res.status(200).send({ status: true, message: "User login successfull", data: { userId: findEmail._id, token: token } });
    }
    catch (err) {
        return res.status(500).json({ status: false, message: err.message });
    }
}
const getUserbyId = async (req, res) => {
    try {
        let userId = req.params.userId;
        if (validator.isMongoId(userId) == 0) {
            return res.status(400).send({ status: false, message: "please provide valid user id" });
        }
        let findUser = await userModel.findOne({ _id: userId });
        if (!findUser) return res.status(404).send({ status: false, message: "no user found" });

        return res.status(200).send({ status: true, message: "User profile details", data: findUser })
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }

};
const updateUser = async (req, res) => {
    try {
        let userId = req.params.userId;
        let data = req.body;
        let files = data.files;

        if (Object.keys(data).length == 0 && !files) {
            return res.status(400).json({ status: false, message: "No fields to update" });
        }
        if (!validator.isMongoId(userId)) {
            return res.status(400).send({ status: false, message: "Please provide valid user id" });
        }
        let userData = await userModel.findById(userId);
        if (data.fname) {
            userData.fname = data.fname;
        }
        if (data.lname) {
            userData.lname = data.lname;
        }
        if (data.email) {
            let uemail = await userModel.findOne({ email: data.email });
            if (uemail) {
                return res.status(400).json({ status: false, message: 'Email is already registered.' });
            }
            if (!(validator.isEmail(data.email))) {
                return res.status(400).json({ status: false, message: 'Please enter a valid email address.' });
            }
            userData.email = data.email;
        }
        if (data.phone) {
            let uphone = await userModel.findOne({ phone: data.phone });
            if (!uphone) {
                return res.status(400).json({ status: false, message: 'phone number is already registered.' });
            }
            if (data.phone.length != 10 && !(/^[6-9]{1}[0-9]{9}$/.test(data.phone))) {
                return res.status(400).json({ status: false, message: 'Please give valid phone number.' })
            }
            userData.phone = data.phone;
        }
        if (data.password) {
            if (!(password.length >= 8 && password.length <= 15)) {
                return res.status(400).json({ status: false, message: 'Please enter a valid password.' });
            }
            let hashPassword = await bcrypt.hash(data.password, data.password.length)
            userData.password = hashPassword;
        }
        if (data.address) {
            
            if (data.address.shipping) {
                let { street, city, pincode } = data.address.shipping
                if (street)
                {
                    userData.address.shipping.street = street;
                }
                if (city){
                    userData.address.shipping.city = city;
                }
                
                if (pincode)
                { 
                    if (!(/^[1-9][0-9]{5}$/.test(pincode))||typeof pincode !== 'number') {
                        return res.status(400).json({ status: false, message: "Enter valid pincode" });
                    }
                    userData.address.shipping.pincode = pincode;
                }
            }
            if (data.address.billing) {
                let { street, city, pincode } = data.address.shipping
                if (street)
                {
                    userData.address.billing.street = street;
                }
                if (city){
                    userData.address.billing.city = city;
                }
                if (!(/^[1-9][0-9]{5}$/.test(pincode))||typeof pincode !== 'number') {
                    return res.status(400).json({ status: false, message: "Enter valid pincode" });
                }
                if (pincode)
                { 
                    if (!(/^[1-9][0-9]{5}$/.test(pincode))||typeof pincode !== 'number') {
                        return res.status(400).json({ status: false, message: "Enter valid pincode" });
                    }
                    userData.address.billing.pincode = pincode;
                }

            }
            data.address = address
        }
        let findUser = await userModel.findOneAndUpdate({ _id: userId }, userData, { new: true });
        if (!findUser) return res.status(404).send({ status: false, message: "no user found" });

        return res.status(200).send({ status: true, message: "User profile updated", data: findUser })

    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
}
module.exports = {uploadFile, regUser, login, getUserbyId,updateUser}