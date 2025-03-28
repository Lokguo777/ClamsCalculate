// 初始化時載入記錄
document.addEventListener('DOMContentLoaded', () => {
    loadRecords();
    loadOrders();
    updateInventorySummary();
    // 設置日期輸入框的預設值為今天
    document.getElementById('date').valueAsDate = new Date();
    
    // 監聽大小選單的變化
    document.getElementById('size').addEventListener('change', function() {
        const customSizeInput = document.getElementById('customSize');
        customSizeInput.style.display = this.value === 'custom' ? 'block' : 'none';
    });

    // 監聽訂單大小選單的變化
    document.getElementById('orderSize').addEventListener('change', function() {
        const customSizeInput = document.getElementById('orderCustomSize');
        customSizeInput.style.display = this.value === 'custom' ? 'block' : 'none';
    });
});

// 獲取當前庫存
function getCurrentInventory() {
    const records = JSON.parse(localStorage.getItem('clamRecords') || '[]');
    const orders = JSON.parse(localStorage.getItem('clamOrders') || '[]');
    const inventory = {};
    
    // 處理進貨記錄
    records.forEach(record => {
        if (!inventory[record.size]) {
            inventory[record.size] = 0;
        }
        inventory[record.size] += record.count;
    });
    
    // 處理訂單記錄（減去訂單數量）
    orders.forEach(order => {
        if (!inventory[order.size]) {
            inventory[order.size] = 0;
        }
        inventory[order.size] -= order.count;
    });
    
    return inventory;
}

// 更新庫存統計
function updateInventorySummary() {
    const inventory = getCurrentInventory();
    const inventorySummary = document.getElementById('inventorySummary');
    inventorySummary.innerHTML = '';

    // 創建所有可能的大小選項
    const allSizes = ['特大', '大', '135', '130', '125', '120', '115', '110', '105', '100', '95', '90', '85', '80', '75', '70', '65'];
    
    // 顯示所有大小的庫存（包括庫存為0的）
    allSizes.forEach(size => {
        const count = inventory[size] || 0;
        const div = document.createElement('div');
        div.className = 'inventory-item';
        div.innerHTML = `
            <h4>${size}</h4>
            <div class="count">${count.toFixed(1)} 台斤</div>
        `;
        inventorySummary.appendChild(div);
    });
}

// 從 localStorage 載入記錄
function loadRecords() {
    const records = JSON.parse(localStorage.getItem('clamRecords') || '[]');
    const recordsList = document.getElementById('recordsList');
    recordsList.innerHTML = '';
    
    records.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    records.forEach((record, index) => {
        const recordElement = createRecordElement(record, index);
        recordsList.appendChild(recordElement);
    });

    // 更新庫存統計
    updateInventorySummary();
}

// 從 localStorage 載入訂單
function loadOrders() {
    const orders = JSON.parse(localStorage.getItem('clamOrders') || '[]');
    const ordersList = document.getElementById('ordersList');
    ordersList.innerHTML = '';
    
    orders.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    orders.forEach((order, index) => {
        const orderElement = createOrderElement(order, index);
        ordersList.appendChild(orderElement);
    });

    // 更新庫存統計
    updateInventorySummary();
}

// 創建記錄元素
function createRecordElement(record, index) {
    const div = document.createElement('div');
    div.className = 'record-item';
    
    const date = new Date(record.date);
    const formattedDate = date.toLocaleDateString('zh-TW');
    
    div.innerHTML = `
        <span>${formattedDate} - ${record.size} - ${record.count} 台斤</span>
        <button class="delete-btn" onclick="deleteRecord(${index})">刪除</button>
    `;
    
    return div;
}

// 創建訂單元素
function createOrderElement(order, index) {
    const div = document.createElement('div');
    div.className = 'record-item order-item';
    
    const date = new Date(order.date);
    const formattedDate = date.toLocaleDateString('zh-TW');
    
    div.innerHTML = `
        <span>${formattedDate} - ${order.customerName} - ${order.size} - ${order.count} 台斤</span>
        <button class="delete-btn" onclick="deleteOrder(${index})">刪除</button>
    `;
    
    return div;
}

// 新增記錄
function addRecord() {
    const dateInput = document.getElementById('date');
    const sizeSelect = document.getElementById('size');
    const customSizeInput = document.getElementById('customSize');
    const countInput = document.getElementById('count');
    
    if (!dateInput.value || !sizeSelect.value || !countInput.value) {
        alert('請填寫所有必要欄位！');
        return;
    }
    
    if (sizeSelect.value === 'custom' && !customSizeInput.value) {
        alert('請輸入自訂大小！');
        return;
    }
    
    const size = sizeSelect.value === 'custom' ? customSizeInput.value : sizeSelect.value;
    
    const record = {
        date: dateInput.value,
        size: size,
        count: parseFloat(countInput.value)
    };
    
    const records = JSON.parse(localStorage.getItem('clamRecords') || '[]');
    records.push(record);
    localStorage.setItem('clamRecords', JSON.stringify(records));
    
    // 清空輸入框
    countInput.value = '';
    customSizeInput.value = '';
    customSizeInput.style.display = 'none';
    sizeSelect.value = '';
    
    // 重新載入記錄
    loadRecords();
}

// 新增訂單
function addOrder() {
    const customerNameInput = document.getElementById('customerName');
    const orderSizeSelect = document.getElementById('orderSize');
    const orderCustomSizeInput = document.getElementById('orderCustomSize');
    const orderCountInput = document.getElementById('orderCount');
    
    if (!customerNameInput.value || !orderSizeSelect.value || !orderCountInput.value) {
        alert('請填寫所有必要欄位！');
        return;
    }
    
    if (orderSizeSelect.value === 'custom' && !orderCustomSizeInput.value) {
        alert('請輸入自訂大小！');
        return;
    }
    
    const size = orderSizeSelect.value === 'custom' ? orderCustomSizeInput.value : orderSizeSelect.value;
    const orderCount = parseFloat(orderCountInput.value);
    
    // 檢查庫存
    const inventory = getCurrentInventory();
    const currentStock = inventory[size] || 0;
    
    if (currentStock < orderCount) {
        alert(`庫存不足！目前 ${size} 的庫存為 ${currentStock.toFixed(1)} 台斤，無法完成訂單。`);
        return;
    }
    
    const order = {
        date: new Date().toISOString().split('T')[0],
        customerName: customerNameInput.value,
        size: size,
        count: orderCount
    };
    
    const orders = JSON.parse(localStorage.getItem('clamOrders') || '[]');
    orders.push(order);
    localStorage.setItem('clamOrders', JSON.stringify(orders));
    
    // 清空輸入框
    customerNameInput.value = '';
    orderCountInput.value = '';
    orderCustomSizeInput.value = '';
    orderCustomSizeInput.style.display = 'none';
    orderSizeSelect.value = '';
    
    // 重新載入訂單
    loadOrders();
}

// 刪除記錄
function deleteRecord(index) {
    if (!confirm('確定要刪除這筆記錄嗎？')) {
        return;
    }
    
    const records = JSON.parse(localStorage.getItem('clamRecords') || '[]');
    records.splice(index, 1);
    localStorage.setItem('clamRecords', JSON.stringify(records));
    
    // 重新載入記錄
    loadRecords();
}

// 刪除訂單
function deleteOrder(index) {
    if (!confirm('確定要刪除這筆訂單嗎？')) {
        return;
    }
    
    const orders = JSON.parse(localStorage.getItem('clamOrders') || '[]');
    orders.splice(index, 1);
    localStorage.setItem('clamOrders', JSON.stringify(orders));
    
    // 重新載入訂單
    loadOrders();
}

// 顯示列印視窗
function showPrintModal() {
    const modal = document.getElementById('printModal');
    const printContent = document.getElementById('printContent');
    const orders = JSON.parse(localStorage.getItem('clamOrders') || '[]');
    
    // 創建表格
    let tableHTML = `
        <table class="print-table">
            <thead>
                <tr>
                    <th>日期</th>
                    <th>購買人</th>
                    <th>大小</th>
                    <th>數量</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // 按日期排序訂單
    orders.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // 添加訂單資料
    orders.forEach(order => {
        const date = new Date(order.date);
        const formattedDate = date.toLocaleDateString('zh-TW');
        tableHTML += `
            <tr>
                <td>${formattedDate}</td>
                <td>${order.customerName}</td>
                <td>${order.size}</td>
                <td>${order.count} 台斤</td>
            </tr>
        `;
    });
    
    tableHTML += `
            </tbody>
        </table>
    `;
    
    printContent.innerHTML = tableHTML;
    modal.style.display = 'block';
}

// 關閉列印視窗
function closePrintModal() {
    const modal = document.getElementById('printModal');
    modal.style.display = 'none';
}

// 列印訂單
function printOrders() {
    window.print();
} 