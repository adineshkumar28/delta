<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TVS LP46 Neo - 50x30 (2 UPS) Label Print</title>
    <script src="https://cdn.jsdelivr.net/npm/bwip-js@4.3.0/dist/bwip-js.min.js"></script>

<style>
/* ================= PRINT SETTINGS ================= */
@media print {
    @page {
        /* 2 labels × 30mm = 60mm width, height = 50mm */
        size: 60mm 50mm portrait;
        margin: 0;
    }

    body {
        margin: 0;
        padding: 0;
        width: 60mm;
    }
}

/* ================= ROW CONTAINER ================= */
.label-container {
    display: flex;
    justify-content: space-between; /* exact 2 columns */
    align-items: center;
    width: 60mm;   /* full roll width */
    height: 50mm;  /* label height */
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    page-break-after: always;
}

/* ================= SINGLE LABEL ================= */
.label {
    width: 30mm;   /* individual label width */
    height: 50mm;  /* individual label height */
    padding: 1mm;
    box-sizing: border-box;
    text-align: center;
    overflow: hidden; /* prevent overlap */
}

/* ================= TEXT SIZES ================= */
.company-name { font: bold 10pt Arial; margin: 0 0 1mm; }
.item-name   { font: normal 8pt Arial; margin: 0 0 1mm; }
.price       { font: bold 9pt Arial; margin: 1mm 0; }
.barcode-number { font: bold 7pt Arial; margin-top: 1mm; }
/* Added styles for PKD and EXP dates */
.dates-container { font: normal 6pt Arial; margin-top: 1mm; display: flex; justify-content: space-between; }
.date-field { font: bold 6pt Arial; }

canvas { max-width: 100%; }
</style>
</head>
<body>

<div id="labels-container"></div>

<script>
let labelData = [];
let barcodeType = 'code128';
const COLS = 2; // 🔒 fixed for 2 UPS

function renderLabels() {
    const container = document.getElementById('labels-container');
    container.innerHTML = '';

    let currentRow = null;
    let countInRow = 0;

    labelData.forEach((item, itemIndex) => {
        for (let i = 0; i < item.quantity; i++) {

            if (countInRow % COLS === 0) {
                currentRow = document.createElement('div');
                currentRow.className = 'label-container';
                container.appendChild(currentRow);
                countInRow = 0;
            }

            const label = document.createElement('div');
            label.className = 'label';
            label.innerHTML = `
                <div class="company-name">${item.companyName}</div>
                <div class="item-name">${item.itemName}</div>
                <div class="price">₹${item.price}</div>
                <canvas id="bc-${itemIndex}-${i}"></canvas>
                <div class="barcode-number">${item.barcode}</div>
                <div class="dates-container">
                    <span class="date-field">PKD: ${item.pkdDate || 'N/A'}</span>
                    <span class="date-field">EXP: ${item.expDate || 'N/A'}</span>
                </div>
            `;

            currentRow.appendChild(label);

            // Barcode generation tuned for 50mm height
            bwipjs.toCanvas(`bc-${itemIndex}-${i}`, {
                bcid: barcodeType,
                text: item.barcode,
                scale: 2,
                height: 8,           // mm – fits perfectly
                includetext: false,
                textxalign: 'center'
            });

            countInRow++;
        }
    });
}

window.addEventListener('message', function(e) {
    if (e.data === 'print') {
        window.print();
        return;
    }

    barcodeType = e.data.barcode_type || 'code128';
    labelData = JSON.parse(e.data.itemData);
    renderLabels();
});
</script>

</body>
</html>
