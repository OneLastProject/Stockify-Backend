const express = require("express");
const router = express.Router();
const { upload, uploadCSV } = require("../middleware/upload");
const authMiddleware = require("../middleware/isAuth");
const validateRequest = require("../middleware/validateRequest");
const validateUpdateQuantity = require("../middleware/validateUpdateQuantity");
const { addProductSchema } = require("../validations/productValidation");
const { addProduct, getProducts, uploadProductsCSV, updateProductQuantity } = require("../controllers/productController");

router.get("/get-products", authMiddleware, getProducts);
router.post("/add-product", authMiddleware, upload.single("image"), validateRequest(addProductSchema), addProduct);
router.post("/upload-csv", authMiddleware, uploadCSV.single("file"), uploadProductsCSV);
router.patch("/update-quantity/:id", authMiddleware, validateUpdateQuantity, updateProductQuantity);

module.exports = router;
