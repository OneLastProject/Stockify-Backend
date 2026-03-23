const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/isAuth");
const { getInvoices, viewInvoice, downloadInvoice, updateInvoiceStatus, deleteInvoice } = require("../controllers/invoiceController");

router.get("/get-invoices", authMiddleware, getInvoices);
router.get("/view/:id", authMiddleware, viewInvoice);
router.get("/download/:id", authMiddleware, downloadInvoice);
router.patch("/update-status/:id", authMiddleware, updateInvoiceStatus);
router.delete("/delete/:id", authMiddleware, deleteInvoice);

module.exports = router;
