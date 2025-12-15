<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TVS LP46 Neo - Label Print</title>
    <script src="https://cdn.jsdelivr.net/npm/bwip-js@4.3.0/dist/bwip-js.min.js"></script>
  <style>
    @media print {
        @page { 
            size: 108mm 30mm; 
            margin: 0; 
        }
        body { 
            margin: 0; 
            padding: 0; 
            width: 108mm; 
        }
        .label-container { 
            page-break-after: always; 
            page-break-inside: avoid; 
            width: 108mm !important; 
            height: 30mm !important; 
        }
        .label { 
            page-break-inside: avoid; 
        }
    }

    body { 
        margin: 0; 
        padding: 0; 
        background: #fff; 
    }

    .label-container {
        display: flex;
        justify-content: space-between;  /* Perfect equal spacing for 2 labels */
        align-items: center;
        width: 108mm;
        height: 30mm;
        padding: 0 2mm;  /* Small side padding to center the pair naturally */
        box-sizing: border-box;
        page-break-after: always;
    }

    .label {
        box-sizing: border-box;
        width: 54mm;     /* 54mm × 2 = 108mm exact (no gap issue) */
        height: 30mm;
        padding: 1.5mm 2mm;  /* Slightly increased padding for better look */
        text-align: center;
        /* border: 0.5px dotted #ccc; */ /* Test mode-க்கு only – final-இல் remove */
    }

    .company-name { 
        font: bold 11pt Arial; 
        margin: 0 0 1mm; 
    }
    .item-name { 
        font: normal 9pt Arial; 
        margin: 0 0 1mm; 
        white-space: nowrap; 
        overflow: hidden; 
        text-overflow: ellipsis; 
    }
    .price { 
        font: bold 13pt Arial; 
        margin: 1.5mm 0; 
    }
    .barcode-number { 
        font: bold 8pt Arial; 
        margin-top: 1.5mm; 
    }
</style>
</head>
<body>

<div id="labels-container"></div>

<script>
    let labelData = [];
    let barcodeType = 'code128';

const sizes = {
    '100x50': { w: 100, h: 50, cols: 1, company: '14pt', item: '12pt', price: '18pt', bcHeight: '18mm', num: '10pt' },
    '50x25' : { w: 50,  h: 25, cols: 2, company: '12pt', item: '8pt',  price: '10pt', bcHeight: '7mm',  num: '7pt' },
    '50x30' : { w: 54,  h: 30, cols: 2, company: '11pt', item: '9pt',  price: '13pt', bcHeight: '10mm', num: '8pt' }  
    // width 54mm × 2 = 108mm exact (no extra gap in code, natural roll gap handle பண்ணும்)
};

    function renderLabels() {
        const container = document.getElementById('labels-container');
        container.innerHTML = '';

        const sizeValue = document.getElementById('size')?.value || '2_50x30';
        const [colsStr, dim] = sizeValue.split('_');
        const cols = parseInt(colsStr);
        const [width, height] = dim.split('x');
        const config = sizes[`${width}x${height}`];

        // Dynamic styles for selected size
        const style = document.createElement('style');
        style.textContent = `
            .label-container { width: ${config.w * cols + (cols > 1 ? 8 : 0)}mm; height: ${config.h}mm; }
            .label { width: ${config.w}mm; height: ${config.h}mm; }
            .company-name { font-size: ${config.company}; }
            .item-name   { font-size: ${config.item}; }
            .price       { font-size: ${config.price}; }
        `;
        document.head.appendChild(style);

        let currentRow = null;
        let countInRow = 0;

        labelData.forEach(item => {
            for (let i = 0; i < item.quantity; i++) {
                if (countInRow % cols === 0) {
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
                    <div style="margin-top:1mm">
                        <canvas id="bc-${labelData.indexOf(item)}-${i}"></canvas>
                    </div>
                    <div class="barcode-number">${item.barcode}</div>
                `;
                currentRow.appendChild(label);

                // Generate barcode
                try {
                    bwipjs.toCanvas(`bc-${labelData.indexOf(item)}-${i}`, {
                        bcid:        barcodeType,
                        text:        item.barcode,
                        scale:       2,
                        height:      parseFloat(config.bcHeight),
                        includetext: false,
                        textxalign:  'center',
                    });
                } catch (e) {
                    console.error(e);
                }

                countInRow++;
            }
        });
    }

    window.addEventListener('message', function(e) {
        if (e.data === 'print') { window.print(); return; }

        const data = e.data;
        barcodeType = data.barcode_type || 'code128';
        labelData = JSON.parse(data.itemData);

        renderLabels();
    });
</script>
</body>
</html>