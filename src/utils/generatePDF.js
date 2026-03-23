const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const generateInvoicePDF = ({ invoice, product, user }) => {
  return new Promise((resolve, reject) => {
    const dir = path.join(__dirname, "../../uploads/invoices");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const filename = `${invoice.invoiceId}.pdf`;
    const filePath = path.join(dir, filename);
    const doc = new PDFDocument({ size: "A4", margins: { top: 0, bottom: 0, left: 0, right: 0 } });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const W = 495; // usable width (595 - 2*50)
    const formatDate = (d) =>
      new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    const fmtAmt = (n) => `Rs. ${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // ── Header bar ─────────────────────────────────────────────────────────────
    doc.rect(0, 0, 595, 80).fill("#1a1a2e");
    doc.fillColor("#ffffff").fontSize(26).font("Helvetica-Bold").text("STOCKIFY", 50, 22);
    doc.fillColor("#b6b9cf").fontSize(10).font("Helvetica").text("Inventory Management System", 50, 54);
    doc.fillColor("#ffffff").fontSize(20).font("Helvetica-Bold").text("INVOICE", 50, 30, { align: "right", width: W });

    // ── Invoice meta (right side) ───────────────────────────────────────────────
    let y = 100;
    doc.fillColor("#6b7280").fontSize(9).font("Helvetica").text("INVOICE NUMBER", 350, y, { width: 195, align: "right" });
    doc.fillColor("#1a1a2e").fontSize(11).font("Helvetica-Bold").text(invoice.invoiceId, 350, y + 13, { width: 195, align: "right" });

    doc.fillColor("#6b7280").fontSize(9).font("Helvetica").text("INVOICE DATE", 350, y + 35, { width: 195, align: "right" });
    doc.fillColor("#374151").fontSize(10).font("Helvetica").text(formatDate(invoice.createdAt), 350, y + 48, { width: 195, align: "right" });

    doc.fillColor("#6b7280").fontSize(9).text("DUE DATE", 350, y + 68, { width: 195, align: "right" });
    doc.fillColor("#374151").fontSize(10).text(formatDate(invoice.dueDate), 350, y + 81, { width: 195, align: "right" });

    // ── Billed To (left side) ───────────────────────────────────────────────────
    doc.fillColor("#6b7280").fontSize(9).font("Helvetica").text("BILLED TO", 50, y);
    doc.fillColor("#1a1a2e").fontSize(13).font("Helvetica-Bold").text(user.name, 50, y + 13);
    doc.fillColor("#374151").fontSize(10).font("Helvetica").text(user.email, 50, y + 31);

    // ── Divider ─────────────────────────────────────────────────────────────────
    y = 255;
    doc.moveTo(50, y).lineTo(545, y).strokeColor("#e5e7eb").lineWidth(1).stroke();

    // ── Table header ────────────────────────────────────────────────────────────
    y += 15;
    doc.rect(50, y, W, 24).fill("#b6b9cf");
    doc.fillColor("#000000").fontSize(10).font("Helvetica-Bold");
    doc.text("Product", 60, y + 7, { width: 190 });
    doc.text("Category", 250, y + 7, { width: 100 });
    doc.text("Qty", 350, y + 7, { width: 50, align: "right" });
    doc.text("Unit Price", 400, y + 7, { width: 80, align: "right" });
    doc.text("Total", 480, y + 7, { width: 60, align: "right" });

    // ── Table row ───────────────────────────────────────────────────────────────
    y += 24;
    const baseAmount = product.price * invoice.unitsBought;
    const tax = parseFloat((invoice.amount - baseAmount).toFixed(2));

    doc.rect(50, y, W, 30).fill("#f9fafb");
    doc.fillColor("#374151").fontSize(10).font("Helvetica");
    doc.text(product.name, 60, y + 10, { width: 190 });
    doc.text(product.category, 250, y + 10, { width: 100 });
    doc.text(String(invoice.unitsBought), 350, y + 10, { width: 50, align: "right" });
    doc.text(fmtAmt(product.price), 400, y + 10, { width: 80, align: "right" });
    doc.text(fmtAmt(baseAmount), 480, y + 10, { width: 60, align: "right" });

    // bottom border of row
    y += 30;
    doc.moveTo(50, y).lineTo(545, y).strokeColor("#e5e7eb").stroke();

    // ── Totals ───────────────────────────────────────────────────────────────────
    y += 15;
    doc.fillColor("#6b7280").fontSize(10).font("Helvetica").text("Subtotal", 380, y, { width: 100 });
    doc.fillColor("#374151").text(fmtAmt(baseAmount), 480, y, { width: 60, align: "right" });

    y += 18;
    doc.fillColor("#6b7280").text("Tax (15%)", 380, y, { width: 100 });
    doc.fillColor("#374151").text(fmtAmt(tax), 480, y, { width: 60, align: "right" });

    y += 12;
    doc.moveTo(380, y).lineTo(545, y).strokeColor("#d1d5db").stroke();

    y += 10;
    doc.rect(380, y, 165, 26).fill("#1a1a2e");
    doc.fillColor("#ffffff").fontSize(11).font("Helvetica-Bold");
    doc.text("Total Due", 388, y + 8, { width: 80 });
    doc.text(fmtAmt(invoice.amount), 468, y + 8, { width: 72, align: "right" });

    // ── Note ─────────────────────────────────────────────────────────────────────
    y += 50;
    doc.rect(50, y, W, 28).fill("#f3f4f6");
    doc.fillColor("#6b7280").fontSize(9).font("Helvetica")
      .text("Please pay within 10 days of receiving this invoice. Thank you for your business!", 60, y + 9, { width: W - 20 });

    // ── Footer ───────────────────────────────────────────────────────────────────
    doc.rect(0, 780, 595, 62).fill("#1a1a2e");
    doc.fillColor("#b6b9cf").fontSize(9).font("Helvetica")
      .text("Stockify - Inventory Management System", 50, 800, { align: "center", width: W });
    doc.fillColor("#6b7280").fontSize(8)
      .text(`Generated on ${formatDate(new Date())}`, 50, 816, { align: "center", width: W });

    doc.end();
    stream.on("finish", () => resolve(`uploads/invoices/${filename}`));
    stream.on("error", reject);
  });
};

module.exports = generateInvoicePDF;
