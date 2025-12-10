"use strict";

let currentPage = 0; // Initialize the page number
let isLoading = false; // Track loading state
let startFromFirst = 0;


// Infinite scroll event listener
/*window.addEventListener('scroll', () => {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight && !isLoading) {
        isLoading = true;
        loadMoreItems(); // Load more items when the user reaches the bottom
    }
});*/


$("#loadMoreBtn").on('click', function(){
    loadMoreItems();
});
$("#item_category_id, #item_brand_id, #warehouse_id, #party_id").on('change', function(){
    currentPage = 0;
    startFromFirst = 0;
    loadMoreItems();
});

function loadMoreItems() {
    currentPage++; // Increment the page number
    $.ajax({
        url: baseURL + '/item/ajax/pos/item-grid/get-list',
        method: 'GET',
        data: {
            search: $('#search_item').val(), // Pass the search term if necessary
            page: currentPage,
            item_category_id : $("#item_category_id").val(),
            item_brand_id : $("#item_brand_id").val(),
            warehouse_id : $("#warehouse_id").val(),
            party_id : $("#party_id").val(),
        },
        beforeSend: function() {
          showLoadingMessage(); // Show the loading message
        },
        success: function (response) {
            if (response.length > 0) {
                var jsonObject = response;//JSON.parse(response);
                jsonObject.forEach(item => {
                    appendItemToGrid(item); // Function to append item to the grid
                });
                hideLoadingMessage();
            }else{
                if(startFromFirst == 0){
                    $('#itemsGrid').html('');
                }
                noMoreData();
            }
            isLoading = false; // Reset loading state
        },
        error: function () {
            isLoading = false; // Reset loading state on error
        },
        complete: function() {

        },
    });
}

function noMoreData(){
    loadMoreBtn.textContent = 'No More Data';
    loadMoreBtn.disabled = true; // Re-enable the button on error
    hideSpinner();
}

function showLoadingMessage() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    loadMoreBtn.textContent = 'Loading...';
    loadMoreBtn.disabled = true;
    showSpinner();
}

function hideLoadingMessage() {
    loadMoreBtn.textContent = 'Load More';
    loadMoreBtn.disabled = false; // Re-enable the button
    hideSpinner();
}

function appendItemToGrid(item) {
    // Default image if no image
    var image_path = item.image_path 
        ? baseURL + '/item/getimage/thumbnail/' + item.image_path 
        : baseURL + '/assets/images/no-image.jpg';

    const itemHtml = `
        <div class="col-6 col-sm-12 col-md-6 col-lg-6 mb-3">
            <div class="item-card-wrapper position-relative">
                <div class="card item-card-old border-0 shadow-sm rounded-3 overflow-hidden h-100" 
                     data-item='${JSON.stringify(item)}' 
                     style="cursor: pointer;">
                    
                    <!-- Image + Qty Badge + Hover + Icon -->
                    <div class="position-relative">
                        <img src="${image_path}" 
                             class="w-100" 
                             style="height: 180px; object-fit: cover;" 
                             alt="${item.name}">
                             
                        <!-- Qty Badge -->
                        <span class="position-absolute top-0 start-0 m-2 badge bg-dark px-3 py-2 rounded-pill">
                            Qty: ${_parseQuantity(item.current_stock)}
                        </span>
                    </div>

                    <!-- Card Body -->
                    <div class="card-body p-3 bg-light">
                        <h6 class="card-title mb-2 text-dark fw-bold" style="font-size: 0.95rem; line-height: 1.3;">
                            ${item.name}
                        </h6>
                        <p class="card-text  fw-bold mb-0" style="font-size: 1.1rem;">
                            ₹${_parseFix(item.sale_price)}
                        </p>
                    </div>

                    <!-- Hover Overlay with + Icon -->
                    <div class="add-overlay position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center rounded-3" 
                         style="background: rgba(0,0,0,0.7); opacity: 0; transition: opacity 0.3s;">
                        <i class="bx bx-plus-circle bx-lg text-white"></i>
                    </div>
                </div>
            </div>
        </div>
    `;

    if (startFromFirst == 0) {
        startFromFirst++;
        $('#itemsGrid').html('');
    }
    $('#itemsGrid').append(itemHtml);
}

// Hover effect + Click handler (ஒரே event)
$(document).on('mouseenter', '.item-card-old', function() {
    $(this).find('.add-overlay').css('opacity', '1');
}).on('mouseleave', '.item-card-old', function() {
    $(this).find('.add-overlay').css('opacity', '0');
});

// Click handler
$(document).on('click', '.item-card-old', function(e) {
    e.preventDefault();
    e.stopPropagation();

    const item = $(this).data('item');
    if (item) {
        smartAddItem(item);
    }
});

function addItemToGrid(item) {
    console.log("Adding item from grid:", item.name);

    // Step 1: Check if this item is already in the invoice table
    let existingRowId = null;

    $('#invoiceItemsTable tbody tr').each(function () {
        const rowId = $(this).attr('id');
        if (!rowId || rowId === '' || $(this).hasClass('default-row')) return true; // skip

        const itemIdInput = $(this).find(`input[name="item_id[${rowId}]"]`);
        if (itemIdInput.length && parseInt(itemIdInput.val()) === parseInt(item.id)) {
            existingRowId = rowId;
            return false; // break loop
        }
    });

    // Step 2: If already exists → Increase quantity
    if (existingRowId !== null) {
        const qtyInput = $(`#invoiceItemsTable input[name="quantity[${existingRowId}]"]`);
        let currentQty = parseFloat(qtyInput.val()) || 0;
        qtyInput.val(currentQty + 1).trigger('change'); // This will recalculate total, tax, etc.

        // Visual feedback - highlight the row
        const row = $(`#${existingRowId}`);
        row.addClass('highlight');
        setTimeout(() => row.removeClass('highlight'), 800);

        // Optional: Scroll to that row
        $('html, body').animate({
            scrollTop: row.offset().top - 200
        }, 400);

        return; // Exit - Important! Don't add new row
    }

    // Step 3: If not exists → Add new row (existing logic)
    var dataObject = {
        warehouse_id: item.warehouse_id || $('#warehouse_id').val(),
        warehouse_name: item.warehouse_name || '',
        id: item.id,
        name: item.name,
        brand_name: item.brand_name || '',
        tracking_type: item.tracking_type || 'regular',
        description: item.description || '',
        sale_price: item.sale_price,
        is_sale_price_with_tax: item.is_sale_price_with_tax ? 1 : 0,
        tax_id: item.tax_id || null,
        quantity: 1, // Start with 1
        taxList: item.taxList || [],
        unitList: item.unitList || [],
        base_unit_id: item.base_unit_id,
        selected_unit_id: item.selected_unit_id || item.base_unit_id,
        conversion_rate: item.conversion_rate || 1,
        sale_price_discount: item.sale_price_discount || 0,
        discount_type: item.sale_price_discount_type || 'fixed',
        discount_amount: 0,
        total_price_after_discount: 0,
        tax_amount: 0,
        total_price: 0,
        mrp: item.mrp || 0,
        serial_numbers: (item.tracking_type === 'serial' && item.serial_numbers) 
            ? JSON.stringify(item.serial_numbers) : '',
        batch_no: (item.tracking_type === 'batch') ? (item.batch_no || '') : '',
        mfg_date: (item.tracking_type === 'batch') ? (item.mfg_date || '') : '',
        exp_date: (item.tracking_type === 'batch') ? (item.exp_date || '') : '',
        model_no: (item.tracking_type === 'batch') ? (item.model_no || '') : '',
        color: (item.tracking_type === 'batch') ? (item.color || '') : '',
        size: (item.tracking_type === 'batch') ? (item.size || '') : '',
    };

    // Add new row
    addRowToInvoiceItemsTable(dataObject, false);

    // Optional: Auto focus to search box after adding
    $('#search_item').focus();

    smartAddItem(item);
}
jQuery(document).ready(function($) {
    loadMoreItems();
});

// One time event listener — எத்தனை தடவை Load More அடிச்சாலும் ஒரு தடவைதான் bind ஆகும்
$(document).on('click', '.item-card', function(e) {
    // Prevent double trigger if clicked on + icon area
    if ($(e.target).closest('.add-item').length === 0) return;

    const item = $(this).data('item');
    if (!item) return;

    // Prevent double click in 300ms
    const now = Date.now();
    if (window.lastGridClickTime && (now - window.lastGridClickTime < 300)) return;
    window.lastGridClickTime = now;

    smartAddItem(item);
});

// One time event listener — எத்தனை தடவை Load More அடிச்சாலும் ஒரு தடவைதான் bind ஆகும்
$(document).on('click', '.item-card', function(e) {
    // Prevent double trigger if clicked on + icon area
    if ($(e.target).closest('.add-item').length === 0) return;

    const item = $(this).data('item');
    if (!item) return;

    // Prevent double click in 300ms
    const now = Date.now();
    if (window.lastGridClickTime && (now - window.lastGridClickTime < 300)) return;
    window.lastGridClickTime = now;

    smartAddItem(item);
});