// Web3 Integration for Food Traceability System
class FoodTraceabilityApp {
    constructor() {
        this.web3 = null;
        this.contract = null;
        this.account = null;
        
        // YOUR CONTRACT ADDRESS FROM REMIX
        this.contractAddress = "0x64d54ba559847e6D63d57b48a60f0B994A39Da17";
        
        // Contract ABI - Provided by user
        this.contractABI = [
            {
                "inputs": [
                    {"internalType": "string", "name": "_productId", "type": "string"},
                    {"internalType": "uint256", "name": "_lotCode", "type": "uint256"},
                    {"internalType": "string", "name": "_name", "type": "string"},
                    {"internalType": "string", "name": "_origin", "type": "string"}
                ],
                "name": "createProduct",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "anonymous": false,
                "inputs": [
                    {"indexed": true, "internalType": "uint256", "name": "lotCode", "type": "uint256"},
                    {"indexed": false, "internalType": "string", "name": "productId", "type": "string"},
                    {"indexed": false, "internalType": "string", "name": "name", "type": "string"}
                ],
                "name": "ProductCreated",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {"indexed": true, "internalType": "uint256", "name": "lotCode", "type": "uint256"},
                    {"indexed": true, "internalType": "address", "name": "from", "type": "address"},
                    {"indexed": true, "internalType": "address", "name": "to", "type": "address"}
                ],
                "name": "ProductTransferred",
                "type": "event"
            },
            {
                "anonymous": false,
                "inputs": [
                    {"indexed": true, "internalType": "uint256", "name": "lotCode", "type": "uint256"},
                    {"indexed": false, "internalType": "string", "name": "action", "type": "string"},
                    {"indexed": false, "internalType": "string", "name": "location", "type": "string"}
                ],
                "name": "TraceStepAdded",
                "type": "event"
            },
            {
                "inputs": [
                    {"internalType": "uint256", "name": "_lotCode", "type": "uint256"},
                    {"internalType": "string", "name": "_location", "type": "string"},
                    {"internalType": "string", "name": "_action", "type": "string"}
                ],
                "name": "transferProduct",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "uint256", "name": "_lotCode", "type": "uint256"}],
                "name": "getProduct",
                "outputs": [
                    {"internalType": "string", "name": "productId", "type": "string"},
                    {"internalType": "string", "name": "name", "type": "string"},
                    {"internalType": "string", "name": "origin", "type": "string"},
                    {"internalType": "address", "name": "currentOwner", "type": "address"},
                    {"internalType": "uint256", "name": "timestamp", "type": "uint256"}
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "getTotalProducts",
                "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "uint256", "name": "_lotCode", "type": "uint256"}],
                "name": "getTraceHistory",
                "outputs": [
                    {"internalType": "address[]", "name": "handlers", "type": "address[]"},
                    {"internalType": "string[]", "name": "locations", "type": "string[]"},
                    {"internalType": "uint256[]", "name": "timestamps", "type": "uint256[]"},
                    {"internalType": "string[]", "name": "actions", "type": "string[]"}
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "productCount",
                "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                "name": "products",
                "outputs": [
                    {"internalType": "string", "name": "productId", "type": "string"},
                    {"internalType": "uint256", "name": "lotCode", "type": "uint256"},
                    {"internalType": "string", "name": "name", "type": "string"},
                    {"internalType": "string", "name": "origin", "type": "string"},
                    {"internalType": "address", "name": "currentOwner", "type": "address"},
                    {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
                    {"internalType": "bool", "name": "exists", "type": "bool"}
                ],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [
                    {"internalType": "uint256", "name": "", "type": "uint256"},
                    {"internalType": "uint256", "name": "", "type": "uint256"}
                ],
                "name": "traceHistory",
                "outputs": [
                    {"internalType": "address", "name": "handler", "type": "address"},
                    {"internalType": "string", "name": "location", "type": "string"},
                    {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
                    {"internalType": "string", "name": "action", "type": "string"}
                ],
                "stateMutability": "view",
                "type": "function"
            }
        ];
    }

    // Initialize Web3 connection
    async init() {
        try {
            if (typeof window.ethereum !== 'undefined') {
                console.log('✅ MetaMask detected!');
                this.web3 = new Web3(window.ethereum);
                
                // Request account access
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                
                // Get accounts
                const accounts = await this.web3.eth.getAccounts();
                this.account = accounts[0];
                
                // Initialize contract
                this.contract = new this.web3.eth.Contract(this.contractABI, this.contractAddress);
                
                console.log('✅ Connected to blockchain!');
                console.log('📍 Contract Address:', this.contractAddress);
                console.log('🔐 Account:', this.account);
                
                // Update UI
                this.updateConnectionStatus(true);
                this.loadDashboardData();
                
                return true;
            } else {
                console.error('❌ MetaMask not detected');
                this.showAlert('Please install MetaMask to use this application!', 'error');
                return false;
            }
        } catch (error) {
            console.error('❌ Failed to initialize Web3:', error);
            this.showAlert('Failed to connect to blockchain. Please check MetaMask.', 'error');
            return false;
        }
    }

    // Create a new product
    async createProduct(productId, lotCode, name, origin) {
        try {
            this.showLoading('Creating product on blockchain...');
            
            console.log('🏭 Creating product:', {
                productId,
                lotCode,
                name,
                origin,
                from: this.account
            });

            const result = await this.contract.methods.createProduct(
                productId, 
                parseInt(lotCode), 
                name, 
                origin
            ).send({ 
                from: this.account,
                gas: 600000,          // ✅ Increased gas limit
                gasPrice: '20000000000' // ✅ Added explicit gas price (20 Gwei)
            });
            
            console.log('✅ Product created successfully:', result);
            this.showAlert(`Product "${name}" created successfully! Lot Code: ${lotCode}`, 'success');
            this.loadDashboardData(); // Refresh dashboard
            
            this.hideLoading();
            return result;
        } catch (error) {
            console.error('❌ Error creating product:', error);
            let errorMessage = 'Failed to create product.';
            
            if (error.message.includes('revert')) {
                errorMessage += ' Product with this lot code may already exist.';
            } else if (error.message.includes('gas')) {
                errorMessage += ' Transaction failed due to gas issues.';
            } else {
                errorMessage += ' ' + error.message;
            }
            
            this.showAlert(errorMessage, 'error');
            this.hideLoading();
            throw error;
        }
    }

    // Transfer product
    async transferProduct(lotCode, location, action) {
        try {
            this.showLoading('Transferring product on blockchain...');
            
            console.log('🚚 Transferring product:', {
                lotCode,
                location,
                action,
                from: this.account
            });

            const result = await this.contract.methods.transferProduct(
                lotCode, 
                location, 
                action
            ).send({ 
                from: this.account,
                gas: 200000
            });
            
            console.log('✅ Product transferred successfully:', result);
            this.showAlert(`Product transferred successfully! Action: ${action}`, 'success');
            
            this.hideLoading();
            return result;
        } catch (error) {
            console.error('❌ Error transferring product:', error);
            let errorMessage = 'Failed to transfer product.';
            
            if (error.message.includes('revert')) {
                errorMessage += ' Product may not exist or you may not be authorized.';
            } else {
                errorMessage += ' ' + error.message;
            }
            
            this.showAlert(errorMessage, 'error');
            this.hideLoading();
            throw error;
        }
    }

    // Trace product by lot code
    async traceProduct(lotCode) {
        try {
            this.showLoading('Tracing product on blockchain...');
            
            console.log('🔍 Tracing product with lot code:', lotCode);
            
            // Get product details
            const product = await this.contract.methods.getProduct(lotCode).call();
            
            // Check if product exists
            if (!product.productId || product.productId === '') {
                this.hideLoading();
                this.showAlert(`No product found with lot code: ${lotCode}`, 'warning');
                return null;
            }
            
            // Get trace history
            const history = await this.contract.methods.getTraceHistory(lotCode).call();
            
            const traceData = {
                product: {
                    productId: product.productId,
                    name: product.name,
                    origin: product.origin,
                    currentOwner: product.currentOwner,
                    timestamp: new Date(product.timestamp * 1000),
                    exists: true
                },
                history: {
                    handlers: history.handlers,
                    locations: history.locations,
                    timestamps: history.timestamps.map(ts => new Date(ts * 1000)),
                    actions: history.actions
                }
            };
            
            console.log('✅ Product traced successfully:', traceData);
            this.hideLoading();
            
            return traceData;
        } catch (error) {
            console.error('❌ Error tracing product:', error);
            this.showAlert('Failed to trace product. Please check the lot code and try again.', 'error');
            this.hideLoading();
            throw error;
        }
    }

    // Load dashboard data
    async loadDashboardData() {
        try {
            if (!this.contract) return;
            
            // Get total products using getTotalProducts function
            const totalProducts = await this.contract.methods.getTotalProducts().call();
            document.getElementById('total-products').textContent = totalProducts;
            
            // Get current block number
            const blockNumber = await this.web3.eth.getBlockNumber();
            document.getElementById('blockchain-height').textContent = blockNumber;
            
            // Update connected account display
            const shortAccount = this.account ? 
                `${this.account.substring(0, 6)}...${this.account.substring(38)}` : 
                'Not Connected';
            document.getElementById('connected-account').textContent = shortAccount;
            
            console.log('📊 Dashboard updated:', {
                totalProducts,
                blockNumber,
                account: shortAccount
            });
            
        } catch (error) {
            console.error('❌ Error loading dashboard:', error);
        }
    }

    // Update connection status in UI
    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('connection-status');
        const statusText = document.getElementById('status-text');
        const connectBtn = document.getElementById('connect-wallet');
        
        if (connected) {
            statusElement.className = 'status-connected';
            statusText.textContent = 'Connected';
            connectBtn.textContent = 'Connected ✓';
            connectBtn.disabled = true;
        } else {
            statusElement.className = 'status-disconnected';
            statusText.textContent = 'Disconnected';
            connectBtn.textContent = 'Connect Wallet';
            connectBtn.disabled = false;
        }
    }

    // Display trace results
    displayTraceResults(traceData) {
        const resultsContainer = document.getElementById('trace-results');
        
        if (!traceData || !traceData.product.exists) {
            resultsContainer.style.display = 'none';
            return;
        }
        
        const product = traceData.product;
        const history = traceData.history;
        
        resultsContainer.innerHTML = `
            <div class="product-info">
                <h3>🍕 Product Information</h3>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Product ID:</span>
                        <span class="info-value">${product.productId}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Product Name:</span>
                        <span class="info-value">${product.name}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Origin:</span>
                        <span class="info-value">${product.origin}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Current Owner:</span>
                        <span class="info-value">${product.currentOwner}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Created:</span>
                        <span class="info-value">${product.timestamp.toLocaleString()}</span>
                    </div>
                </div>
            </div>
            
            <div class="trace-history">
                <h3>📍 Supply Chain Journey</h3>
                ${history.actions.length > 0 ? 
                    history.actions.map((action, index) => `
                        <div class="trace-step">
                            <div class="step-icon">${index + 1}</div>
                            <div class="step-content">
                                <div class="step-action">${action}</div>
                                <div class="step-location">📍 ${history.locations[index]}</div>
                                <div class="step-time">🕒 ${history.timestamps[index].toLocaleString()}</div>
                            </div>
                        </div>
                    `).join('')
                    : '<p>No supply chain history available for this product.</p>'
                }
            </div>
        `;
        
        resultsContainer.style.display = 'block';
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
    }

    // Utility functions
    showLoading(message) {
        document.getElementById('loading-text').textContent = message;
        document.getElementById('loading-overlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loading-overlay').style.display = 'none';
    }

    showAlert(message, type) {
        // Create alert element
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        
        // Insert at top of main content
        const mainContent = document.querySelector('.main-content .container');
        mainContent.insertBefore(alert, mainContent.firstChild);
        
        // Remove after 5 seconds
        setTimeout(() => {
            alert.remove();
        }, 5000);
        
        // Auto-scroll to alert
        alert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Get network info
    async getNetworkInfo() {
        try {
            const networkId = await this.web3.eth.net.getId();
            const gasPrice = await this.web3.eth.getGasPrice();
            
            console.log('🌐 Network Info:', {
                networkId,
                gasPrice: this.web3.utils.fromWei(gasPrice, 'gwei') + ' gwei'
            });
            
            return { networkId, gasPrice };
        } catch (error) {
            console.error('❌ Error getting network info:', error);
        }
    }
}

// Global app instance
window.foodApp = new FoodTraceabilityApp();