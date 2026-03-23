const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const path = require("path");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const productRoutes = require("./routes/productRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const homeRoutes = require("./routes/homeRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/home", homeRoutes);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Book Catalog API Running" });
});

module.exports = app;