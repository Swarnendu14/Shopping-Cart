const userModel = require("../model/userModel");
const bcrypt = require("bcrypt");
const { uploadFile } = require("../aws/awsConfig");
const jwt = require("jsonwebtoken");
const dotenv = require('dotenv').config()
const { SECRET_KEY } = process.env;

const {
    isValidBody,
    isValidName,
    isValidEmail,
    isValidNumber,
    isValid,
    isValidPassword,
    isValidPincode,
    isValidId,
} = require("../utils/validator");

// ===================Register====================================================================
const createUser = async function(req, res) {
    try {
        const files = req.files;
        const data = JSON.parse(req.body.data);
        const { fname, lname, email, phone, password, address } = data


        if (!isValidBody(data)) {
            return res.status(400).send({
                status: false,
                message: "Please provide data in the request body!",
            });
        }

        if (!fname)
            return res
                .status(400)
                .send({ status: false, message: "First Name is required!" });
        if (!isValid(fname) || !isValidName(fname)) {
            return res
                .status(400)
                .send({ status: false, message: "fname is invalid" });
        }

        if (!lname)
            return res
                .status(400)
                .send({ status: false, message: "Last Name is required!" });
        if (!isValid(lname) || !isValidName(lname)) {
            return res
                .status(400)
                .send({ status: false, message: "lname is invalid" });
        }

        if (!email)
            return res
                .status(400)
                .send({ status: false, message: "Email is required!" });
        if (!isValidEmail(email)) {
            return res
                .status(400)
                .send({ status: false, message: "Email is invalid!" });
        }
        let userEmail = await userModel.findOne({ email: email });
        if (userEmail)
            return res.status(401).send({
                status: false,
                message: "This email address already exists, please enter a unique email address!",
            });

        if (!phone)
            return res
                .status(400)
                .send({ status: false, message: "Phone number is required!" });
        if (!isValidNumber(phone)) {
            return res
                .status(400)
                .send({ status: false, message: "Phone is invalid" });
        }
        let userNumber = await userModel.findOne({ phone: phone });
        if (userNumber)
            return res.status(409).send({
                status: false,
                message: "This phone number already exists, please enter a unique phone number!",
            });

        if (!password)
            return res
                .status(400)
                .send({ status: false, message: "Password is required!" });
        if (!isValidPassword(password)) {
            return res.status(400).send({
                status: false,
                message: "Password should be strong, please use one number, one upper case, one lower case and one special character and characters should be between 8 to 15 only!",
            });
        }

        const salt = await bcrypt.genSalt(10);
        data.password = await bcrypt.hash(data.password, salt);

        if (!address.shipping.street)
            return res
                .status(400)
                .send({ status: false, message: "Shipping Street is required!" });
        if (!isValidName(address.shipping.street)) {
            return res
                .status(400)
                .send({ status: false, message: "Invalid shipping street!" });
        }

        if (!address.shipping.city)
            return res
                .status(400)
                .send({ status: false, message: "Shipping City is required!" });
        if (!isValidName(address.shipping.city)) {
            return res
                .status(400)
                .send({ status: false, message: "Invalid shipping city!" });
        }

        if (!address.shipping.pincode)
            return res
                .status(400)
                .send({ status: false, message: "Shipping Pincode is required!" });
        if (!isValidPincode(address.shipping.pincode)) {
            return res
                .status(400)
                .send({ status: false, message: "Invalid shipping pincode!" });
        }

        if (!address.billing.street)
            return res
                .status(400)
                .send({ status: false, message: "Billing Street is required!" });
        if (!isValidName(address.billing.street)) {
            return res
                .status(400)
                .send({ status: false, message: "Invalid billing street!" });
        }

        if (!address.billing.city)
            return res
                .status(400)
                .send({ status: false, message: "Billing City is required!" });
        if (!isValidName(address.billing.city)) {
            return res
                .status(400)
                .send({ status: false, message: "Invalid billing city!" });
        }

        if (!address.billing.pincode)
            return res
                .status(400)
                .send({ status: false, message: "Billing Pincode is required!" });
        if (!isValidPincode(address.billing.pincode)) {
            return res
                .status(400)
                .send({ status: false, message: "Invalid billing pincode!" });
        }

        //aws
        if (files && files.length > 0) {
            let uploadedFileURL = await uploadFile(files[0]);

            data.profileImage = uploadedFileURL;
        } else {
            return res.status(400).send({ message: "Files are required!" });
        }

        const document = await userModel.create(data);
        return res.status(201).send({
            status: true,
            message: "user successfully created",
            data: document,
        });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

//==================logIn=====================================================================

const loginUser = async function(req, res) {
    try {
        const { email, password } = req.body
        if (!isValidEmail(email)) {
            return res.status(400).send({ status: false, message: "please enter email correctly" })
        }
        if (!password) {
            return res.status(400).send({ status: false, message: "please enter your password" })
        }
        const userData = await userModel.findOne({ email: email })
        if (!userData) {
            return res.status(400).send({ status: false, message: "please enter correct email" })
        }
        const passwordMatch = await bcrypt.compare(password, userData.password);
        if (!passwordMatch) {
            return res.status(400).send({ status: false, message: 'Please enter the correct password' });
        }
        let token = jwt.sign({ id: userData._id }, SECRET_KEY, { expiresIn: '24h' })
        if (!token) {
            return res.status(500).send({ status: false, message: "try again ..." })
        }
        return res.status(200).send({ status: true, message: "user login successfuly", data: { userId: userData._id, token: token } })


    } catch (err) {
        res.status(500).send({ staus: false, message: err.message });
    }
};

//get user

const getUserProfile = async function(req, res) {
    try {
        let userId = req.params.userId;

        if (!isValidId(userId)) {
            return res
                .status(400)
                .send({ status: false, message: " Invalid userId" });
        }

        const userProfile = await userModel.findById(userId);

        if (!userProfile) {
            return res
                .status(404)
                .send({ status: false, message: "User Profile Not Found" });
        }
        res.status(200).send({
            status: true,
            message: "User profile details",
            data: userProfile,
        });
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
};

//upadateProfile
const updateProfile = async function(req, res) {
    try {

        const files = req.files;
        const data = req.body;
        let address = {}
        let imgUrl = ''
        if (req.body.address) {
            address = JSON.parse(req.body.address);
        }
        const { fname, lname, email, phone, password } = data
        const { shipping, billing } = address;
        const userId = req.params.userId;

        if (fname) {
            if (!isValid(fname) || !isValidName(fname)) {
                return res.status(400).send({ status: false, message: "fname is invalid" })
            }
        }

        if (lname) {
            if (!isValid(lname) || !isValidName(lname)) {
                return res.status(400).send({ status: false, message: "lname is invalid" });
            }
        }

        if (email) {
            if (!isValidEmail(email)) {
                return res
                    .status(400)
                    .send({ status: false, message: "Email is invalid!" });
            }

            let userEmail = await userModel.findOne({ email: email });
            if (userEmail) {
                return res.status(403).send({
                    status: false,
                    message: "This email address already exists, please enter a unique email address!",
                });
            }
        }

        if (phone) {
            if (!isValidNumber(phone)) {
                return res
                    .status(400)
                    .send({ status: false, message: "Phone is invalid" });
            }

            let userNumber = await userModel.findOne({ phone: phone });
            if (userNumber) {
                return res.status(403).send({
                    status: false,
                    message: "This phone number already exists, please enter a unique phone number!",
                });
            }
        }

        if (password) {
            if (!isValidPassword(password)) {
                return res.status(400).send({
                    status: false,
                    message: "Password should be strong, please use one number, one uppercase letter, one lowercase letter, and one special character. Password should be between 8 to 15 characters long!",
                });
            }
            let salt = await bcrypt.genSalt(10);
            hashedPassword = await bcrypt.hash(password, salt);
        }

        if (address) {
            if (address.shipping) {
                const { street, city, pincode } = address.shipping;

                if (street) {
                    if (!isValidName(street)) {
                        return res
                            .status(400)
                            .send({ status: false, message: "Invalid shipping street!" });
                    }
                }

                if (city) {
                    if (!isValidName(city)) {
                        return res
                            .status(400)
                            .send({ status: false, message: "Invalid shipping city!" });
                    }
                }

                if (pincode) {
                    if (!isValidPincode(pincode)) {
                        return res
                            .status(400)
                            .send({ status: false, message: "Invalid shipping pincode!" });
                    }
                }
            }

            if (address.billing) {
                const { street, city, pincode } = address.billing;

                if (street) {
                    if (!isValidName(street)) {
                        return res
                            .status(400)
                            .send({ status: false, message: "Invalid billing street!" });
                    }
                }

                if (city) {
                    if (!isValidName(city)) {
                        return res
                            .status(400)
                            .send({ status: false, message: "Invalid billing city!" });
                    }
                }

                if (pincode) {
                    if (!isValidPincode(pincode)) {
                        return res
                            .status(400)
                            .send({ status: false, message: "Invalid billing pincode!" });
                    }
                }
            }
        }
        const check = await userModel.findOne({ email: email })
        if (check) {
            return res.status(400).send({ status: false, message: "this email already exists" })
        }
        if (files && files.length > 0) {
            imgUrl = await uploadFile(files[0])
        }

        const upt = {}
        if (fname) {
            upt.fname = fname
        }
        if (lname) {
            upt.lname = lname
        }
        if (email) {
            upt.email = email
        }
        if (phone) {
            upt.phone = phone
        }
        if (password) {
            upt.password = hashedPassword
        }
        if (files) {
            upt.profileImage = imgUrl
        }
        if (Object.keys(address).length != 0) {
            upt.address = address
        }

        const user = await userModel.findOneAndUpdate({ _id: userId }, { $set: upt }, { new: true })
        return res.status(200).send({ status: true, message: "successful", data: user })

    } catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, message: error.message })
    }

}

module.exports = { createUser, loginUser, getUserProfile, updateProfile };