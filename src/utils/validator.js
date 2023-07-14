const mongoose = require("mongoose");


const isValid = function(value) {
    if (typeof value == undefined || value == null || value.length == 0) return false;
    if (typeof value === "string" && value.trim().length === 0) return false;
    return true;
};

const isValidBody = function(data) {
    return Object.keys(data).length > 0;
};


const isValidPassword = function(password) {
    const length = password.length;
    if (length < 9 || length > 14) {
        return false;
    }
    return true;
};


const isValidName = function(name) {
    // a string that can consist of one or more of the specified characters, including lowercase and uppercase letters, spaces, commas, periods, apostrophes, and hyphens.
    if (/^[a-z ,.'-]+$/i.test(name)) return true;
    // i at the end makes the regular expression case-insensitive
    return false;
};

const isValidNumber = function(number) {
    // a 10-digit Indian mobile phone number. It allows for an optional leading 0 followed by a digit from 6 to 9, followed by exactly 9 more digits
    if (/^[0]?[6789]\d{9}$/.test(number)) return true;
    return false;
};

const isValidId = function(id) {
    return mongoose.Types.ObjectId.isValid(id);
};

const isValidPincode = function(pincode) {
    return /^[1-9][0-9]{5}$/.test(pincode);
};

const isValidEmail = function(mail) {
    if (/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(mail)) {
        return true;
    }
};

const isValidSize = function(size) {
    return ["S", "XS", "M", "X", "L", "XXL", "XL"].indexOf(size) !== -1;
};

const isValidPrice = (value) => {
    const regEx = /^[1-9]\d{0,8}(?:\.\d{1,2})?$/
        //allows for a number with up to 9 digits, including an optional decimal point followed by 1 or 2 digits
    const result = regEx.test(value)
    return result
};

const isValidAvailableSizes = (availablesizes) => {
    for (i = 0; i < availablesizes.length; i++) {
        if (!["S", "XS", "M", "X", "L", "XXL", "XL"].includes(availablesizes[i])) return false
    }
    return true
};
const isValidNumbers = function(value) {
    let user = /^[0-9]+$/.test(value)
    return user
}


module.exports = {
    isValid,
    isValidBody,
    isValidPassword,
    isValidName,
    isValidNumber,
    isValidId,
    isValidPincode,
    isValidEmail,
    isValidSize,
    isValidPrice,
    isValidAvailableSizes,
    isValidNumbers
};