const express = require('express')
const router = express.Router()
const { createUser, loginUser, getUserProfile, updateProfile } = require("../controller/userController");
const { createProduct, getProduct, getProductById, deleteProduct, updateProduct } = require("../controller/productController");
const { createCart, updateCart, getCart, deleteCart } = require("../controller/cartController")
const { createOrder, updateOrder } = require("../controller/orderController")

const mid = require("../middleware/auth");

//========================================= UserController =======================================================//

router.post("/register", createUser);
router.post("/login", loginUser);
router.get("/user/:userId/profile", mid.authenticate, getUserProfile);
router.put("/user/:userId/profile", mid.authenticate, mid.authorisation, updateProfile);


//======================================== productController ====================================================//

router.post("/products", createProduct);
router.get("/products", getProduct);
router.get("/products/:productId", getProductById);
router.put("/products/:productId", updateProduct);
router.delete("/products/:productId", deleteProduct);

//======================================= cartController ========================================================//

router.post("/users/:userId/cart", mid.authenticate, mid.authorisation, createCart);
router.put("/users/:userId/cart", mid.authenticate, mid.authorisation, updateCart);
router.get("/users/:userId/cart", mid.authenticate, mid.authorisation, getCart);
router.delete("/users/:userId/cart", mid.authenticate, mid.authorisation, deleteCart);

//======================================= orderController=========================================================//

router.post("/users/:userId/orders", mid.authenticate, mid.authorisation, createOrder);
router.put("/users/:userId/orders", mid.authenticate, mid.authorisation, updateOrder);

module.exports = router