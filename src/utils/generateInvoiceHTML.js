const fs = require("fs");
const path = require("path");

const generateInvoiceHTML = ({ invoice, product, user }) => {
  return new Promise((resolve, reject) => {
    const dir = path.join(__dirname, "../../uploads/invoices");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const filename = `${invoice.invoiceId}.html`;
    const filePath = path.join(dir, filename);

    const formatDate = (d) =>
      new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

    const fmtAmt = (n) =>
      `Rs. ${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const baseAmount = product.price * invoice.unitsBought;
    const tax = parseFloat((invoice.amount - baseAmount).toFixed(2));

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${invoice.invoiceId}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1a1a2e; font-size: 14px; }

    .page { max-width: 720px; margin: 0 auto; padding: 48px; }

    /* Header */
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; }
    .brand-name { font-size: 30px; font-weight: 800; color: #1a1a2e; letter-spacing: 2px; }
    .brand-sub { font-size: 11px; color: #9ca3af; margin-top: 4px; letter-spacing: 1px; text-transform: uppercase; }
    .invoice-label { font-size: 30px; font-weight: 700; color: #b6b9cf; letter-spacing: 4px; text-transform: uppercase; }

    /* Divider */
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }

    /* Bill section */
    .bill-section { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .bill-to label { font-size: 10px; font-weight: 700; color: #9ca3af; letter-spacing: 1.5px; text-transform: uppercase; }
    .bill-to .name { font-size: 16px; font-weight: 700; color: #1a1a2e; margin-top: 6px; }
    .bill-to .email { font-size: 13px; color: #6b7280; margin-top: 4px; }

    .invoice-meta { text-align: right; }
    .meta-row { margin-bottom: 12px; }
    .meta-row label { font-size: 10px; font-weight: 700; color: #9ca3af; letter-spacing: 1.5px; text-transform: uppercase; display: block; }
    .meta-row span { font-size: 14px; color: #1a1a2e; font-weight: 600; margin-top: 3px; display: block; }

    /* Table */
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead tr { background-color: #1a1a2e; }
    thead th { padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 600; color: #b6b9cf; letter-spacing: 1px; text-transform: uppercase; }
    thead th:last-child { text-align: right; }
    tbody td { padding: 14px 16px; border-bottom: 1px solid #f3f4f6; font-size: 13px; color: #374151; }
    tbody td:last-child { text-align: right; font-weight: 600; color: #1a1a2e; }
    tbody tr:last-child td { border-bottom: none; }
    .category-tag { font-size: 11px; color: #9ca3af; margin-top: 3px; }

    /* Totals */
    .totals-section { display: flex; justify-content: flex-end; margin-bottom: 32px; }
    .totals-box { width: 280px; }
    .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; color: #6b7280; border-bottom: 1px solid #f3f4f6; }
    .totals-row span:last-child { font-weight: 500; color: #374151; }
    .totals-row.total { border-bottom: none; border-top: 2px solid #1a1a2e; margin-top: 4px; padding-top: 12px; }
    .totals-row.total span { font-size: 16px; font-weight: 700; color: #1a1a2e; }

    /* Note */
    .note { background: #f9fafb; border-left: 3px solid #b6b9cf; padding: 12px 16px; border-radius: 4px; margin-bottom: 40px; }
    .note p { font-size: 12px; color: #6b7280; }

    /* Footer */
    .footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e5e7eb; padding-top: 24px; }
    .footer span { font-size: 11px; color: #9ca3af; }
  </style>
  <script>
    window.addEventListener('message', (e) => {
      if (e.data === 'print') window.print();
    });
  </script>
</head>
<body>
  <div class="page">

    <div class="header">
      <div>
        <div class="brand-name">STOCKIFY</div>
        <div class="brand-sub">Inventory Management System</div>
      </div>
      <div class="invoice-label">Invoice</div>
    </div>

    <hr class="divider" />

    <div class="bill-section">
      <div class="bill-to">
        <label>Billed to</label>
        <div class="name">${user.name}</div>
        <div class="email">${user.email}</div>
      </div>
      <div class="invoice-meta">
        <div class="meta-row">
          <label>Invoice Number</label>
          <span>${invoice.invoiceId}</span>
        </div>
        <div class="meta-row">
          <label>Invoice Date</label>
          <span>${formatDate(invoice.createdAt)}</span>
        </div>
        <div class="meta-row">
          <label>Due Date</label>
          <span>${formatDate(invoice.dueDate)}</span>
        </div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>Qty</th>
          <th>Unit Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            ${product.name}
            <div class="category-tag">${product.category}</div>
          </td>
          <td>${invoice.unitsBought}</td>
          <td>${fmtAmt(product.price)}</td>
          <td>${fmtAmt(baseAmount)}</td>
        </tr>
      </tbody>
    </table>

    <div class="totals-section">
      <div class="totals-box">
        <div class="totals-row">
          <span>Subtotal</span>
          <span>${fmtAmt(baseAmount)}</span>
        </div>
        <div class="totals-row">
          <span>Tax (15%)</span>
          <span>${fmtAmt(tax)}</span>
        </div>
        <div class="totals-row total">
          <span>Total Due</span>
          <span>${fmtAmt(invoice.amount)}</span>
        </div>
      </div>
    </div>

    <div class="note">
      <p>Please pay within 10 days of receiving this invoice. Thank you for your business!</p>
    </div>

    <div class="footer">
      <span>Stockify &mdash; Inventory Management</span>
      <span>Generated on ${formatDate(new Date())}</span>
      <span>${invoice.invoiceId}</span>
    </div>

  </div>
</body>
</html>`;

    fs.writeFile(filePath, html, (err) => {
      if (err) return reject(err);
      resolve(`uploads/invoices/${filename}`);
    });
  });
};

module.exports = generateInvoiceHTML;
