const cartModel = require("../model/cartModel");
const userModel = require("../model/userModel");
const productModel = require("../model/productModel");
const { uploadFile } = require("../aws/awsConfig");

const {
    isValid,
    isValidId,
    isValidNumbers,
    isValidBody,
} = require("../utils/validator");

function TotalPrice(items, products) {
    let totalPrice = 0
    for (const item of items) {
        const product = products.find(product => product._id.toString() === item.productId.toString());
        if (product) {
            totalPrice += product.price * item.quantity;
        }
    }
    return totalPrice;
}
// creating cart but based on condition that if cart exist then update otherwise create new cart 
const createCart = async function(req, res) {
    try {
        const userId = req.params.userId;
        const { productId, quantity, cartId } = req.body

        //req.body 
        if (!isValidBody(req.body)) {
            return res.status(400).send({ status: false, message: "Enter data in body" })
        }

        //mandatory fields validations
        if (!userId || !productId || !quantity) {
            return res.status(400).send({ status: false, message: "Enter mandatory fields" })
        }

        if (!isValidId(userId)) {
            return res.status(401).send({ status: false, message: "Invalid User Id" })
        }

        const userExist = await userModel.findById(userId)

        if (!userExist) {
            return res.status(404).send({ status: false, message: "User does not exist" })
        }


        if (!isValidId(productId)) {
            return res.status(401).send({ status: false, message: "Invalid product Id" })
        }

        const product = await productModel.findOne({ _id: productId, isDeleted: false })

        if (!product) {
            return res.status(404).send({ status: false, message: "Product does not exist" })
        }

        const userCart = await cartModel.findOne({ userId: userId })

        if (!userCart) {
            let cart = {
                userId: userId,
                items: [],
                totalPrice: 0,
                totalItems: 0
            }
            const createData = await cartModel.create(cart)
            return res.status(201).send({ status: true, message: "cart is created", data: createData })
        }
        if (userCart) {
            // const productInCart = await cartModel.find({})
            if (!cartId) {
                return res.status(400).send({ status: false, message: "Enter cartId" })
            }

            if (!isValidId(cartId)) {
                return res.status(401).send({ status: false, message: "Invalid cart Id" })
            }

            if (userCart._id.toString() !== cartId) {
                return res.status(403).send({ status: false, message: "CartId not matched not Authorised" })
            }

            const existingItems = userCart.items.find((val) => val.productId.toString() == productId)

            if (existingItems) {
                existingItems.quantity += quantity //check
            } else {
                // If the product doesn't exist in the cart, add it as a new item
                userCart.items.push({
                    productId: productId,
                    quantity: quantity
                });
            }
            userCart.totalItems = userCart.items.length;


            userCart.totalPrice = userCart.totalPrice + TotalPrice(userCart.items, [product]);
            // Save the updated cart
            await userCart.save();

            // Return the updated cart document with product details
            const response = {
                _id: userCart._id,
                userId: userCart.userId,
                items: userCart.items.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity
                })),
                totalPrice: userCart.totalPrice,
                totalItems: userCart.totalItems,
                createdAt: userCart.createdAt,
                updatedAt: userCart.updatedAt
            };

            return res.status(201).send({ status: true, message: "cart created", data: response });

        }
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}



// ===============================Update cart=======================================================
const updateCart = async function(req, res) {
    try {
        userId = req.params.userId;

        if (!isValidId(userId)) {
            return res
                .status(400)
                .send({ status: false, message: `${userId} is invalid` });
        }

        const findUser = await userModel.findOne({ _id: userId });
        if (!findUser) {
            return res
                .status(404)
                .send({ status: false, message: "User does not exist" });
        }

        const data = req.body;
        let { cartId, productId, removeProduct } = data;

        if (!isValidBody(data)) {
            return res
                .status(400)
                .send({ status: false, message: "Request body cannot remain empty" });
        }

        if (!productId)
            return res
                .status(400)
                .send({ status: false, message: "Please provide productId" });

        if (!isValidId(productId))
            return res.status(400).send({
                status: false,
                message: `The given productId: ${productId} is not in proper format`,
            });

        const findProduct = await productModel.findOne({
            _id: productId,
            isDeleted: false,
        });

        if (!findProduct) {
            return res.status(404).send({
                status: false,
                message: `Product details are not found with this productId: ${productId}, it must be deleted or not exists`,
            });
        }

        if (!cartId)
            return res
                .status(400)
                .send({ status: false, message: "Please provide cartId" });

        if (!isValidId(cartId))
            return res.status(400).send({
                status: false,
                message: `The given cartId: ${cartId} is not in proper format`,
            });

        const findCart = await cartModel.findOne({ _id: cartId });
        if (!findCart)
            return res.status(404).send({
                status: false,
                message: `Cart does not exists with this provided cartId: ${cartId}`,
            });

        if (findCart.items.length == 0)
            return res.status(400).send({
                status: false,
                message: "You have not added any products in your cart",
            });

        if (!isValid(removeProduct))
            return res
                .status(400)
                .send({ status: false, message: "removeProduct is required" });
        let carts = await cartModel.findOne({ _id: data.cartId });

        let Check = carts.items.find((x) => x.productId.toString() === data.productId.toString());
        if (Check == undefined) {
            return res.status(404).send({ status: false, message: "product is not found " })
        }


        if (!(removeProduct === 0 || removeProduct === 1))
            return res.status(400).send({
                status: false,
                message: "Please enter valid removeproduct it can be only  `0` or `1`",
            });

        let cart = findCart.items;
        for (let i = 0; i < cart.length; i++) {
            if (cart[i].productId == productId) {
                const priceChange = cart[i].quantity * findProduct.price;

                //when removeProduct is 0

                if (removeProduct == 0) {
                    const productRemove = await cartModel.findOneAndUpdate({ _id: cartId }, {
                        $pull: { items: { productId: productId } },
                        totalPrice: findCart.totalPrice - priceChange,
                        totalItems: findCart.totalItems - 1,
                    }, { new: true });
                    return res.status(200).send({
                        status: true,
                        message: "Success",
                        data: productRemove,
                    });
                }

                //when removeProduct is 1

                if (cart[i].quantity == 1 && removeProduct == 1) {

                    const priceUpdate = await cartModel.findOneAndUpdate({ _id: cartId }, {
                        $pull: { items: { productId: productId } },
                        totalPrice: findCart.totalPrice - priceChange,
                        totalItems: findCart.totalItems - 1,
                    }, { new: true });
                    return res.status(200).send({
                        status: true,
                        message: "Success",
                        data: priceUpdate,
                    });
                }

                // decrease the products quantity by 1

                cart[i].quantity = cart[i].quantity - 1;
                const updatedCart = await cartModel.findByIdAndUpdate({ _id: cartId }, {
                    items: cart,
                    totalPrice: findCart.totalPrice - findProduct.price,
                }, { new: true });
                return res.status(200).send({
                    status: true,
                    message: "Success",
                    data: updatedCart,
                });

            }
        }
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
};
//====================================================== GetCart =======================================================//


const getCart = async function(req, res) {
    try {
        let userId = req.params.userId
        if (!userId) return res.status(400).send({ status: false, message: "userid must be present in params" });

        if (!isValidId(userId))
            return res.status(400).send({ status: false, message: "invalid Id" });

        let user = await userModel.findById(userId)
        if (!user) {
            return res.status(404).send({ status: false, message: "Please provide valid user" })
        }
        let cart = await cartModel.findOne({ userId: userId })
        if (!cart) {
            return res.status(404).send({ status: false, message: "There is no cart for this user" })
        }
        return res.status(200).send({ status: true, message: "Detail of cart of this user", data: cart })

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

//=================================================== DeleteCart ======================================================//

const deleteCart = async function(req, res) {
    try {
        let userId = req.params.userId

        if (!userId) return res.status(400).send({ status: false, message: "userid must be present in params" });

        if (!isValidId(userId))
            return res.status(400).send({ status: false, message: "invalid Id" });

        let user = await userModel.findById(userId)
        if (!user) {
            return res.status(404).send({ status: false, message: "Please provide valid user" })
        }

        let cart = await cartModel.findOne({ userId: userId })
        if (!cart) {
            return res.status(404).send({ status: false, message: "There is no cart for this user" })
        }

        cart.items = []
        cart.totalItems = 0
        cart.totalPrice = 0
        let deletedCartDetail = await cartModel.findOneAndUpdate({ _id: cart._id }, cart, { new: true })
            // console.log(deletedCartDetail)
        return res.status(200).send({ status: true, message: "Detail of cart of this user", data: cart })
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


module.exports = { createCart, updateCart, getCart, deleteCart };