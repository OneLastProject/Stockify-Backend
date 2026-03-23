const fs = require("fs");
const mongoose = require("mongoose");
const Product = require("../models/productSchema");
const Invoice = require("../models/invoiceSchema");
const User = require("../models/userSchema");
const Statistics = require("../models/statisticsSchema");
const generateInvoiceHTML = require("../utils/generateInvoiceHTML");
const generateInvoicePDF = require("../utils/generatePDF");
const uploadToDrive = require("../utils/googleDrive");
const { addProductSchema } = require("../validations/productValidation");

exports.updateProductQuantity = async (req, res) => {
  try {
    const product = req.product;
    const { units } = req.body;

    product.unit = product.unit - units;
    await product.save();

    const baseAmount = product.price * units;
    const amount = parseFloat((baseAmount * 1.15).toFixed(2));

    const invoice = await Invoice.create({
      product: product._id,
      user: req.user.id,
      unitsBought: units,
      amount,
    });

    const user = await User.findById(req.user.id).select("name email");
    const [htmlContent, pdfBuffer] = await Promise.all([
      generateInvoiceHTML({ invoice, product, user }),
      generateInvoicePDF({ invoice, product, user }),
    ]);

    const [htmlUrl, pdfUrl] = await Promise.all([
      uploadToDrive({
        fileName: `${invoice.invoiceId}.html`,
        mimeType: "text/html",
        buffer: Buffer.from(htmlContent, "utf8"),
      }),
      uploadToDrive({
        fileName: `${invoice.invoiceId}.pdf`,
        mimeType: "application/pdf",
        buffer: pdfBuffer,
      }),
    ]);

    invoice.htmlPath = htmlUrl;
    invoice.pdfPath = pdfUrl;
    await invoice.save();

    await Statistics.create({
      product: product._id,
      user: req.user.id,
      status: "Sell",
      unit: units,
      amount,
    });

    return res.status(200).json({ message: "Quantity updated successfully", product, invoice });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 10;
    const skip = (page - 1) * limit;
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const [total, products, categories, allProducts, topSelling] = await Promise.all([
      Product.countDocuments({ createdBy: req.user.id }),
      Product.find({ createdBy: req.user.id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Product.distinct("category", { createdBy: req.user.id }),
      Product.find({ createdBy: req.user.id }, "price unit stockDetails"),
      Statistics.aggregate([
        { $match: { user: userId, status: "Sell" } },
        { $group: { _id: "$product", totalUnits: { $sum: "$unit" }, totalAmount: { $sum: "$amount" } } },
        { $sort: { totalUnits: -1 } },
        { $limit: 6 },
      ]),
    ]);

    const totalUnits = allProducts.reduce((sum, p) => sum + p.unit, 0);
    const totalAmount = allProducts.reduce((sum, p) => sum + p.price * p.unit, 0);
    const topSellingAmount = topSelling.reduce((sum, p) => sum + p.totalAmount, 0);
    const lowStock = allProducts.filter((p) => p.stockDetails === "Low stock").length;
    const outOfStock = allProducts.filter((p) => p.stockDetails === "Out of stock").length;

    return res.status(200).json({
      products,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
      stats: {
        categories: categories.length,
        totalProducts: totalUnits,
        totalAmount,
        topSellingCount: 6,
        topSellingAmount,
        lowStock,
        outOfStock,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

exports.uploadProductsCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No CSV file uploaded" });
    }

    const fileContent = fs.readFileSync(req.file.path, "utf8");
    fs.unlinkSync(req.file.path);

    const rows = fileContent.split("\n").map((r) => r.trim()).filter((r) => r);
    const headers = rows[0].split(",").map((h) => h.trim());

    const requiredFields = ["name", "productId", "category", "price", "quantity", "unit", "expiryDate", "thresholdValue", "image"];
    const missingHeaders = requiredFields.filter((f) => !headers.includes(f));
    if (missingHeaders.length > 0) {
      return res.status(400).json({ message: `CSV is missing required columns: ${missingHeaders.join(", ")}` });
    }

    const existingProducts = await Product.find({}, "productId");
    const existingIds = new Set(existingProducts.map((p) => p.productId));

    const toInsert = [];
    const skipped = [];

    for (let i = 1; i < rows.length; i++) {
      const values = rows[i].split(",").map((v) => v.trim());
      const row = {};
      headers.forEach((h, idx) => { row[h] = values[idx]; });

      const { error } = addProductSchema.validate(row, { abortEarly: false, stripUnknown: true });
      if (error) {
        skipped.push({ row: i, reason: error.details.map((d) => d.message).join(", ") });
        continue;
      }

      if (existingIds.has(row.productId)) {
        skipped.push({ row: i, reason: `Product ID "${row.productId}" already exists` });
        continue;
      }

      const unit = Number(row.unit);
      const thresholdValue = Number(row.thresholdValue);
      const stockDetails = unit <= 0 ? "Out of stock" : unit <= thresholdValue ? "Low stock" : "In-stock";

      existingIds.add(row.productId);
      toInsert.push({
        name: row.name,
        productId: row.productId,
        category: row.category,
        price: Number(row.price),
        quantity: row.quantity,
        unit,
        expiryDate: row.expiryDate,
        thresholdValue,
        image: row.image,
        stockDetails,
        createdBy: req.user.id,
      });
    }

    const inserted = toInsert.length > 0 ? await Product.insertMany(toInsert) : [];

    if (inserted.length > 0) {
      await Statistics.insertMany(
        inserted.map((p) => ({
          product: p._id,
          user: req.user.id,
          status: "Purchase",
          unit: p.unit,
          amount: p.price * p.unit,
        }))
      );
    }

    return res.status(200).json({ inserted: inserted.length, skipped });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

exports.addProduct = async (req, res) => {
  try {
    const {
      name,
      productId,
      category,
      price,
      quantity,
      unit,
      expiryDate,
      thresholdValue,
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Product image is required" });
    }

    const existingProduct = await Product.findOne({ productId });
    if (existingProduct) {
      return res.status(400).json({ message: "Product with this ID already exists" });
    }

    const imageUrl = await uploadToDrive({
      fileName: `${Date.now()}-${req.file.originalname}`,
      mimeType: req.file.mimetype,
      buffer: req.file.buffer,
    });

    const productData = {
      name,
      productId,
      category,
      price: Number(price),
      quantity,
      unit: Number(unit),
      expiryDate,
      thresholdValue: Number(thresholdValue),
      createdBy: req.user.id,
      image: imageUrl,
    };

    const product = await Product.create(productData);

    await Statistics.create({
      product: product._id,
      user: req.user.id,
      status: "Purchase",
      unit: product.unit,
      amount: product.price * product.unit,
    });

    return res.status(201).json({
      message: "Product added successfully",
      product,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

