const productModel = require("../model/productModel");
const { uploadFile } = require("../aws/awsConfig");
const {
    isValid,
    isValidPrice,
    isValidAvailableSizes,
    isValidId,
    isValidNumbers,
    isValidBody,
    isValidName,
} = require("../utils/validator");

//============================================== createProduct =============================================//

let createProduct = async function(req, res) {
    try {
        const data = JSON.parse(req.body.body);
        let {
            title,
            description,
            price,
            currencyId,
            currencyFormat,
            isFreeShipping,
            style,
            availableSizes,
            installments,
        } = data;

        if (!isValidBody(data)) {
            return res
                .status(400)
                .send({
                    status: false,
                    message: "Please provide data in request body",
                });
        }

        if (!title)
            return res
                .status(400)
                .send({ status: false, message: "Title is required!" });

        if (!isValid(title)) {
            return res
                .status(400)
                .send({ status: false, message: "Title is invalid!" });
        }

        let uniquetitle = await productModel.findOne({ title: title });
        if (uniquetitle)
            return res.status(400).send({
                status: false,
                message: "This title already exists, please enter another title.",
            });

        if (!description)
            return res
                .status(400)
                .send({ status: false, message: "Description is required!" });

        if (!isValid(description)) {
            return res
                .status(400)
                .send({ status: false, msg: "descritions is invalid!" });
        }

        if (!price)
            return res
                .status(400)
                .send({ status: false, message: "Price is required!" });

        if (!isValidPrice(price)) {
            return res.status(400).send({ status: false, msg: "Price is invalid!" });
        }

        if (!currencyId)
            return res
                .status(400)
                .send({ status: false, message: "Currency Id is required!" });

        // if (currencyId != "INR")
        //   return res.status(400).send({
        //     status: false,
        //     msg: "Please provide the currencyId as `INR`!",
        //   });

        if (!currencyFormat)
            return res
                .status(400)
                .send({ status: false, message: "Currency Format is required!" });

        // if (currencyFormat != "₹")
        //   return res.status(400).send({
        //     status: false,
        //     message: "Please provide the currencyformat as `₹`!",
        //   });

        if (isFreeShipping) {
            if (!(isFreeShipping == "true" || isFreeShipping == "false")) {
                return res.status(400).send({
                    status: false,
                    message: "isFreeShipping should either be True, or False.",
                });
            }
        }

        let files = req.files; //aws

        if (files && files.length > 0) {

            let uploadedFileURL = await uploadFile(files[0]);

            data.productImage = uploadedFileURL;
        } else {
            return res.status(400).send({ message: "Files are required!" });
        }

        if (!isValid(style)) {
            return res.status(400).send({ status: false, msg: "Style is invalid" });
        }

        if (availableSizes) {
            // availSizes = availableSizes.split(",").map((x) => x.trim());
            data.availableSizes = availableSizes;

            if (!isValidAvailableSizes(availableSizes))
                return res.status(400).send({
                    status: false,
                    message: "availableSizes is required or put valid sizes",
                });
        }

        if (!isValid(installments) || !isValidNumbers(installments)) {
            return res
                .status(400)
                .send({ status: false, message: "Installments' is invalid" });
        }

        const document = await productModel.create(data);
        res.status(201).send({ status: true, message: "Success", data: document });
    } catch (err) {
        res.status(500).send({ staus: false, message: err.message });
    }
};

//============================================== getProduct ===============================================//

const getProduct = async function(req, res) {
    try {
        let { size, name, priceGreaterThan, priceLessThan, priceSort } = req.query;

        const filter = { isDeleted: false };
        if (size) {
            let newsize = size.split(",").map((x) => x.trim());
            if (!isValidAvailableSizes(newsize))
                return res.status(400).send({
                    status: false,
                    message: "availableSizes is required or put valid sizes",
                });

            filter.availableSizes = size;
        }

        if (name) {
            if (!isValid(name))
                return res
                    .status(400)
                    .send({ stastus: false, message: "Invalid naming format!" });
            //   let productByname = new RegExp(name, "g");

            filter.title = { $regex: name, $options: "i" };
        }

        if (priceGreaterThan) {
            priceGreaterThan = (+priceGreaterThan)
            if (typeof priceGreaterThan !== "number") {
                return res.status(400).send({ status: false, message: "Please provide valid number " })
            }
            filter.price = { $gt: priceGreaterThan }
        }
        if (priceLessThan) {
            priceLessThan = (+priceLessThan)
            if (typeof priceLessThan !== "number") {
                return res.status(400).send({ status: false, message: "Please provide valid number " })
            }
            if (filter.price) {
                filter.price.$lt = priceLessThan
            } else {
                filter.price = { $lt: priceLessThan }
            }
        }
        if (priceSort) {
            if (priceSort == 1) {
                let pro = await productModel.find(filter).sort({ price: 1 });
                if (!pro) {
                    return res.status(400).send({
                        status: false,
                        message: "No data found that matches your search",
                    });
                }
                return res.status(200).send({ status: true, message: "Success", data: pro });
            }
            if (priceSort == -1) {
                let newpro = await productModel.find(filter).sort({ price: -1 });
                if (!newpro) {
                    return res.status(404).send({
                        status: false,
                        message: "No data found that matches your search1",
                    });
                }
                return res.status(200).send({ status: true, message: "Success", data: newpro });
            }
        }
        const finaldata = await productModel.find(filter);

        if (!finaldata || finaldata == null || finaldata.length == 0) {
            return res.status(404).send({ status: false, message: "No data found that matches your request" });
        }
        return res.status(200).send({ status: true, message: "Success", data: finaldata });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
};

//====================================== getProductById =================================================//

const getProductById = async function(req, res) {
    try {
        let productId = req.params.productId;

        if (!isValidId(productId)) {
            return res
                .status(400)
                .send({ status: false, message: "ProductId not valid" });
        }

        let productData = await productModel.findOne({
            _id: productId,
            isDeleted: false,
        });
        if (!productData) {
            return res.status(404).send({ status: false, message: "Product not exist" });
        }

        return res
            .status(200)
            .send({ status: true, message: "Success", data: productData });
    } catch (err) {
        return res.status(500).send({ satus: false, err: err.message });
    }
};

//=============================== updateProduct =================================================//

let updateProduct = async function(req, res) {
    try {
        let data = req.body
        let productId = req.params.productId;
        let files = req.files;


        let {
            title,
            description,
            price,
            currencyId,
            currencyFormat,
            isFreeShipping,
            style,
            availableSizes,
            installments,
        } = data;

        if (!isValidBody(data)) {
            return res.status(400).send({
                status: false,
                message: "Please provide data in the request body!",
            });
        }


        if (title) {
            if (!isValid(title)) {
                return res
                    .status(400)
                    .send({ status: false, message: "title is invalid" });
            }
            const uniquetitle = await productModel.findOne({ title: title });
            if (uniquetitle) {
                return res
                    .status(400)
                    .send({ status: false, message: "title is already present" });
            }

        }

        if (description) {
            if (!isValid(description)) {
                return res
                    .status(400)
                    .send({ status: false, message: "description is invalid" });
            }

        }

        if (price) {
            if (!isValidPrice(price)) {
                return res
                    .status(400)
                    .send({ status: false, message: "Price is invalid!" });
            }

        }
        let uploadedFileURL
        if (files && files.length > 0) {
            uploadedFileURL = await uploadFile(files[0]);
        } else if (Object.keys(data).includes("productImage")) {
            return res
                .status(400)
                .send({ status: false, message: "please put the productImage" });
        }

        if (style) {
            if (!isValidName(style)) {
                return res
                    .status(400)
                    .send({ status: false, message: "Style is invalid!" });
            }

        }

        if (installments) {
            if (!isValidNumbers(installments)) {
                return res.status(400).send({
                    status: false,
                    message: "Installments should be a Number only",
                });
            }

        }

        if (availableSizes) {
            if (!isValidAvailableSizes(availableSizes))
                return res.status(400).send({
                    status: false,
                    message: "availableSizes is required or put valid sizes",
                });

        }

        if (!isValidId(productId)) {
            return res
                .status(400)
                .send({ status: false, msg: "Product-id is not valid!" });
        }

        let CheckProduct = await productModel.findById(productId);
        if (!CheckProduct) {
            return res.status(404).send({ status: false, message: "Product not found!" });
        }

        let updateProduct = await productModel.findOneAndUpdate({ _id: productId }, {
            $set: {
                title: title,
                description: description,
                price: price,
                currencyId: currencyId,
                currencyFormat: currencyFormat,
                style: style,
                installments: installments,
                isFreeShipping: isFreeShipping,
                productImage: uploadedFileURL
            },
            $addToSet: {
                availableSizes: availableSizes
            }
        }, { new: true });

        return res.status(200).send({
            status: true,
            message: "Product successfully updated",
            data: updateProduct,
        });
    } catch (error) {
        res.status(500).send({ status: false, err: error.message });
    }
};

//===================================== deleteProduct ===============================================//

const deleteProduct = async(req, res) => {
    try {
        let productId = req.params.productId;

        if (!isValidId(productId)) {
            return res
                .status(400)
                .send({ status: false, message: "ProductId not valid" });
        }

        let productData = await productModel.findOne({
            _id: productId,
            isDeleted: false,
        });
        if (!productData) {
            return res
                .status(404)
                .send({ status: false, message: "Product not exist" });
        }

        await productModel.findOneAndUpdate({ _id: productId }, { isDeleted: true, deletedAt: Date.now() });

        return res
            .status(200)
            .send({ status: true, message: "Product Successfully Deleted" });
    } catch (err) {
        return res.status(500).send({ satus: false, err: err.message });
    }
};

module.exports = {
    createProduct,
    getProduct,
    getProductById,
    deleteProduct,
    updateProduct,
};