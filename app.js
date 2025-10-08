// Main Application Logic for Food Traceability System

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Food Traceability System Loading...');
    
    // Initialize UI event listeners
    initializeEventListeners();
    
    // Try to connect to blockchain automatically after a short delay
    setTimeout(async () => {
        const connected = await window.foodApp.init();
        if (connected) {
            console.log('✅ Auto-connected to blockchain');
        } else {
            console.log('⚠️ Auto-connection failed, user needs to click Connect Wallet');
        }
    }, 1000);
});

// Initialize all event listeners
function initializeEventListeners() {
    console.log('🎛️ Initializing event listeners...');
    
    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => switchTab(button.dataset.tab));
    });
    
    // Wallet connection
    const connectWalletBtn = document.getElementById('connect-wallet');
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', connectWallet);
    }
    
    // QR Scanner controls
    const startCameraBtn = document.getElementById('start-camera');
    const stopCameraBtn = document.getElementById('stop-camera');
    
    if (startCameraBtn) {
        startCameraBtn.addEventListener('click', () => window.qrScanner.startScanning());
    }
    
    if (stopCameraBtn) {
        stopCameraBtn.addEventListener('click', () => window.qrScanner.stopScanning());
    }
    
    // Manual tracing
    const manualTraceBtn = document.getElementById('manual-trace');
    if (manualTraceBtn) {
        manualTraceBtn.addEventListener('click', manualTrace);
    }
    
    // Product creation form
    const createProductForm = document.getElementById('create-product-form');
    if (createProductForm) {
        createProductForm.addEventListener('submit', handleCreateProduct);
    }
    
    // Product transfer form
    const transferProductForm = document.getElementById('transfer-product-form');
    if (transferProductForm) {
        transferProductForm.addEventListener('submit', handleTransferProduct);
    }
    
    // Enter key handling for lot code input
    const lotCodeInput = document.getElementById('lot-code-input');
    if (lotCodeInput) {
        lotCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                manualTrace();
            }
        });
    }
}

// Tab switching functionality
function switchTab(tabName) {
    console.log('🔄 Switching to tab:', tabName);
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Load data if switching to dashboard
    if (tabName === 'dashboard' && window.foodApp.contract) {
        window.foodApp.loadDashboardData();
    }
}

// Connect wallet
async function connectWallet() {
    console.log('🔗 Connecting wallet...');
    const connected = await window.foodApp.init();
    
    if (connected) {
        window.foodApp.showAlert('Wallet connected successfully!', 'success');
    } else {
        window.foodApp.showAlert('Failed to connect wallet. Please check MetaMask.', 'error');
    }
}

// Manual product tracing
async function manualTrace() {
    const lotCodeInput = document.getElementById('lot-code-input');
    const lotCode = lotCodeInput.value.trim();
    
    if (!lotCode) {
        window.foodApp.showAlert('Please enter a lot code', 'warning');
        return;
    }
    
    if (!/^\d{8}$/.test(lotCode)) {
        window.foodApp.showAlert('Lot code must be 8 digits (e.g., 20241006)', 'warning');
        return;
    }
    
    if (!window.foodApp.contract) {
        window.foodApp.showAlert('Please connect your wallet first', 'error');
        return;
    }
    
    try {
        console.log('🔍 Manual trace for lot code:', lotCode);
        const traceData = await window.foodApp.traceProduct(parseInt(lotCode));
        
        if (traceData) {
            window.foodApp.displayTraceResults(traceData);
            addToRecentActivity('manual', parseInt(lotCode), traceData.product.name);
        }
    } catch (error) {
        console.error('❌ Manual trace error:', error);
    }
}

// Handle product creation form
async function handleCreateProduct(event) {
    event.preventDefault();
    
    if (!window.foodApp.contract) {
        window.foodApp.showAlert('Please connect your wallet first', 'error');
        return;
    }
    
    // Get form data
    const productId = document.getElementById('product-id').value.trim();
    const lotCode = document.getElementById('lot-code').value.trim();
    const productName = document.getElementById('product-name').value.trim();
    const origin = document.getElementById('origin').value.trim();
    
    // Validation
    if (!productId || !lotCode || !productName || !origin) {
        window.foodApp.showAlert('Please fill in all fields', 'warning');
        return;
    }
    
    if (!/^\d{8}$/.test(lotCode)) {
        window.foodApp.showAlert('Lot code must be 8 digits (e.g., 20241006)', 'warning');
        return;
    }
    
    if (productId.length < 3 || productId.length > 20) {
        window.foodApp.showAlert('Product ID must be between 3 and 20 characters', 'warning');
        return;
    }
    
    try {
        console.log('🏭 Creating product:', { productId, lotCode, productName, origin });
        
        await window.foodApp.createProduct(productId, parseInt(lotCode), productName, origin);
        
        // Clear form on success
        event.target.reset();
        
        // Add to recent activity
        addToRecentActivity('create', parseInt(lotCode), productName);
        
        // Switch to scan tab to trace the new product
        switchTab('scan');
        document.getElementById('lot-code-input').value = lotCode;
        
    } catch (error) {
        console.error('❌ Product creation error:', error);
    }
}

// Handle product transfer form
async function handleTransferProduct(event) {
    event.preventDefault();
    
    if (!window.foodApp.contract) {
        window.foodApp.showAlert('Please connect your wallet first', 'error');
        return;
    }
    
    // Get form data
    const lotCode = document.getElementById('transfer-lot-code').value.trim();
    const location = document.getElementById('transfer-location').value.trim();
    const action = document.getElementById('transfer-action').value.trim();
    
    // Validation
    if (!lotCode || !location || !action) {
        window.foodApp.showAlert('Please fill in all fields', 'warning');
        return;
    }
    
    if (!/^\d{8}$/.test(lotCode)) {
        window.foodApp.showAlert('Lot code must be 8 digits (e.g., 20241006)', 'warning');
        return;
    }
    
    try {
        console.log('🚚 Transferring product:', { lotCode, location, action });
        
        await window.foodApp.transferProduct(parseInt(lotCode), location, action);
        
        // Clear form on success
        event.target.reset();
        
        // Add to recent activity
        addToRecentActivity('transfer', parseInt(lotCode), `${action} at ${location}`);
        
        // Switch to scan tab to view updated trace
        switchTab('scan');
        document.getElementById('lot-code-input').value = lotCode;
        
    } catch (error) {
        console.error('❌ Product transfer error:', error);
    }
}

// Add activity to recent activity list
function addToRecentActivity(type, lotCode, description) {
    const activityList = document.getElementById('activity-list');
    
    if (!activityList) return;
    
    const icons = {
        'create': '🏭',
        'transfer': '🚚',
        'scan': '📱',
        'manual': '🔍'
    };
    
    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item';
    activityItem.innerHTML = `
        <div class="activity-icon">${icons[type] || '📝'}</div>
        <div class="activity-content">
            <div class="activity-text">${description} (Lot: ${lotCode})</div>
            <div class="activity-time">${new Date().toLocaleString()}</div>
        </div>
    `;
    
    // Add to top of list
    activityList.insertBefore(activityItem, activityList.firstChild);
    
    // Keep only last 10 activities
    const activities = activityList.children;
    while (activities.length > 10) {
        activityList.removeChild(activities[activities.length - 1]);
    }
}

// Generate demo data for testing
function generateDemoData() {
    console.log('🎭 Generating demo data...');
    
    // Demo products for testing
    const demoProducts = [
        { id: 'PIZZA001', lotCode: 20241007, name: 'Margherita Pizza', origin: 'Sunshine Farms, CA' },
        { id: 'PIZZA002', lotCode: 20241008, name: 'Pepperoni Pizza', origin: 'Green Valley Farm, TX' },
        { id: 'SHRIMP001', lotCode: 20241009, name: 'Cooked Shrimp 16/20', origin: 'Ocean Fresh, FL' }
    ];
    
    // Auto-fill form with demo data
    const productIdField = document.getElementById('product-id');
    const lotCodeField = document.getElementById('lot-code');
    const productNameField = document.getElementById('product-name');
    const originField = document.getElementById('origin');
    
    if (productIdField && lotCodeField && productNameField && originField) {
        const demo = demoProducts[Math.floor(Math.random() * demoProducts.length)];
        productIdField.value = demo.id;
        lotCodeField.value = demo.lotCode;
        productNameField.value = demo.name;
        originField.value = demo.origin;
        
        window.foodApp.showAlert('Demo data loaded! You can create this product or modify the fields.', 'info');
    }
    
    // Switch to create tab
    switchTab('create');
}

// Test functionality
function runSystemTest() {
    console.log('🧪 Running system test...');
    
    const results = [];
    
    // Test 1: Check Web3 connection
    if (typeof window.ethereum !== 'undefined') {
        results.push('✅ Test 1 passed: MetaMask detected');
    } else {
        results.push('❌ Test 1 failed: MetaMask not detected');
    }
    
    // Test 2: Check app initialization
    if (window.foodApp) {
        results.push('✅ Test 2 passed: Food app initialized');
    } else {
        results.push('❌ Test 2 failed: Food app not initialized');
    }
    
    // Test 3: Check QR scanner
    if (window.qrScanner) {
        results.push('✅ Test 3 passed: QR scanner initialized');
    } else {
        results.push('❌ Test 3 failed: QR scanner not initialized');
    }
    
    // Test 4: Check HTML5 QR Code library
    if (typeof Html5Qrcode !== 'undefined') {
        results.push('✅ Test 4 passed: HTML5 QR Code library loaded');
    } else {
        results.push('❌ Test 4 failed: HTML5 QR Code library not loaded');
    }
    
    // Test 5: Check contract connection
    if (window.foodApp.contract && window.foodApp.account) {
        results.push('✅ Test 5 passed: Contract connected');
    } else {
        results.push('⚠️ Test 5 pending: Contract not connected (click Connect Wallet)');
    }
    
    // Test 6: Check contract address
    if (window.foodApp.contractAddress) {
        results.push(`✅ Test 6 passed: Contract address set (${window.foodApp.contractAddress})`);
    } else {
        results.push('❌ Test 6 failed: Contract address not set');
    }
    
    // Display results
    console.log('🧪 System Test Results:');
    results.forEach(result => console.log(result));
    
    window.foodApp.showAlert(`System test completed. ${results.filter(r => r.includes('✅')).length}/${results.length} tests passed. Check console for details.`, 'info');
}

// Quick trace function for testing
async function quickTrace(lotCode) {
    console.log('⚡ Quick trace for:', lotCode);
    
    if (!window.foodApp.contract) {
        window.foodApp.showAlert('Please connect your wallet first', 'error');
        return;
    }
    
    document.getElementById('lot-code-input').value = lotCode;
    switchTab('scan');
    await manualTrace();
}

// Quick create function for testing
async function quickCreate(productId, lotCode, name, origin) {
    console.log('⚡ Quick create:', { productId, lotCode, name, origin });
    
    if (!window.foodApp.contract) {
        window.foodApp.showAlert('Please connect your wallet first', 'error');
        return;
    }
    
    // Fill form
    document.getElementById('product-id').value = productId;
    document.getElementById('lot-code').value = lotCode;
    document.getElementById('product-name').value = name;
    document.getElementById('origin').value = origin;
    
    // Switch to create tab
    switchTab('create');
    
    // Auto-submit after a brief delay
    setTimeout(() => {
        document.getElementById('create-product-form').dispatchEvent(new Event('submit'));
    }, 500);
}

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Alt + T for system test
    if (event.altKey && event.key === 't') {
        event.preventDefault();
        runSystemTest();
    }
    
    // Alt + D for demo data
    if (event.altKey && event.key === 'd') {
        event.preventDefault();
        generateDemoData();
    }
    
    // Alt + C for connect wallet
    if (event.altKey && event.key === 'c') {
        event.preventDefault();
        connectWallet();
    }
    
    // Alt + 1, 2, 3 for tab switching
    if (event.altKey && event.key >= '1' && event.key <= '3') {
        event.preventDefault();
        const tabs = ['scan', 'create', 'dashboard'];
        switchTab(tabs[parseInt(event.key) - 1]);
    }
    
    // Escape to close any QR scanner
    if (event.key === 'Escape' && window.qrScanner.isScanning) {
        window.qrScanner.stopScanning();
    }
});

// Export functions for debugging and console access
window.appUtils = {
    generateDemoData,
    runSystemTest,
    switchTab,
    connectWallet,
    quickTrace,
    quickCreate,
    manualTrace
};

// Show helpful console messages
console.log('✅ Main application logic loaded');
console.log('💡 Keyboard shortcuts:');
console.log('   Alt+T: Run system test');
console.log('   Alt+D: Load demo data');
console.log('   Alt+C: Connect wallet');
console.log('   Alt+1/2/3: Switch tabs');
console.log('   Escape: Stop QR scanner');
console.log('');
console.log('🛠️ Debug functions available:');
console.log('   appUtils.quickTrace(20241007)');
console.log('   appUtils.quickCreate("PIZZA001", 20241007, "Test Pizza", "Test Farm")');
console.log('   appUtils.runSystemTest()');
console.log('   window.foodApp.loadDashboardData()');

// Add window error handler for better debugging
window.addEventListener('error', function(event) {
    console.error('🚨 JavaScript Error:', event.error);
    if (window.foodApp) {
        window.foodApp.showAlert('A JavaScript error occurred. Check the console for details.', 'error');
    }
});

// Add unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(event) {
    console.error('🚨 Unhandled Promise Rejection:', event.reason);
    if (window.foodApp) {
        window.foodApp.showAlert('A network error occurred. Please check your connection and try again.', 'error');
    }
});