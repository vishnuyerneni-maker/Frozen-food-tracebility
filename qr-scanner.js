// QR Code Scanner for Food Traceability
class QRCodeScanner {
    constructor() {
        this.html5QrCode = null;
        this.isScanning = false;
    }

    // Start camera scanning
    async startScanning() {
        try {
            if (this.isScanning) {
                console.log('⚠️ Scanner already running');
                return;
            }

            const qrReaderElement = document.getElementById("qr-reader");
            const startButton = document.getElementById("start-camera");
            const stopButton = document.getElementById("stop-camera");

            // Show QR reader and hide start button
            qrReaderElement.style.display = "block";
            startButton.style.display = "none";
            stopButton.style.display = "inline-block";

            this.html5QrCode = new Html5Qrcode("qr-reader");
            
            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0
            };

            await this.html5QrCode.start(
                { facingMode: "environment" }, // Use back camera
                config,
                (decodedText, decodedResult) => {
                    console.log('✅ QR Code scanned:', decodedText);
                    this.handleQRResult(decodedText);
                    this.stopScanning(); // Stop after successful scan
                },
                (errorMessage) => {
                    // Console log errors are too noisy, so we'll ignore them
                    // console.log('QR scanning error:', errorMessage);
                }
            );

            this.isScanning = true;
            console.log('📱 QR Scanner started');

        } catch (error) {
            console.error('❌ Error starting QR scanner:', error);
            
            // Show user-friendly error message
            if (error.name === 'NotAllowedError') {
                window.foodApp.showAlert('Camera access denied. Please allow camera access and try again.', 'error');
            } else if (error.name === 'NotFoundError') {
                window.foodApp.showAlert('No camera found. Please check your camera connection.', 'error');
            } else {
                window.foodApp.showAlert('Failed to start camera: ' + error.message, 'error');
            }
            
            this.resetUI();
        }
    }

    // Stop camera scanning
    async stopScanning() {
        try {
            if (this.html5QrCode && this.isScanning) {
                await this.html5QrCode.stop();
                console.log('🛑 QR Scanner stopped');
            }
        } catch (error) {
            console.error('❌ Error stopping QR scanner:', error);
        }
        
        this.resetUI();
        this.isScanning = false;
        this.html5QrCode = null;
    }

    // Reset UI elements
    resetUI() {
        const qrReaderElement = document.getElementById("qr-reader");
        const startButton = document.getElementById("start-camera");
        const stopButton = document.getElementById("stop-camera");

        qrReaderElement.style.display = "none";
        startButton.style.display = "inline-block";
        stopButton.style.display = "none";
    }

    // Handle QR scan result
    async handleQRResult(qrData) {
        try {
            console.log('🔍 Processing QR data:', qrData);
            
            // Try to extract lot code from QR data
            let lotCode = this.extractLotCode(qrData);
            
            if (!lotCode) {
                window.foodApp.showAlert('Invalid QR code format. Expected lot code not found.', 'warning');
                return;
            }

            // Show success message
            window.foodApp.showAlert(`QR Code scanned successfully! Lot Code: ${lotCode}`, 'success');
            
            // Update manual input field
            document.getElementById('lot-code-input').value = lotCode;
            
            // Automatically trace the product
            await this.traceScannedProduct(lotCode);
            
        } catch (error) {
            console.error('❌ Error handling QR result:', error);
            window.foodApp.showAlert('Error processing QR code: ' + error.message, 'error');
        }
    }

    // Extract lot code from QR data
    extractLotCode(qrData) {
        // Handle different QR code formats
        
        // Format 1: Just the lot code (e.g., "20241006")
        if (/^\d{8}$/.test(qrData)) {
            return parseInt(qrData);
        }
        
        // Format 2: Product ID:Lot Code (e.g., "PIZZA001:20241006")
        const colonFormat = qrData.match(/[A-Z0-9]+:(\d{8})/);
        if (colonFormat) {
            return parseInt(colonFormat[1]);
        }
        
        // Format 3: JSON format (e.g., '{"productId":"PIZZA001","lotCode":"20241006"}')
        try {
            const jsonData = JSON.parse(qrData);
            if (jsonData.lotCode) {
                return parseInt(jsonData.lotCode);
            }
        } catch (e) {
            // Not JSON format, continue
        }
        
        // Format 4: URL format (e.g., "https://trace.app/product/20241006")
        const urlFormat = qrData.match(/\/(\d{8})(?:\?|$)/);
        if (urlFormat) {
            return parseInt(urlFormat[1]);
        }
        
        // Format 5: Extract any 8-digit number from the string
        const numberMatch = qrData.match(/\d{8}/);
        if (numberMatch) {
            return parseInt(numberMatch[0]);
        }
        
        return null;
    }

    // Trace the scanned product
    async traceScannedProduct(lotCode) {
        try {
            console.log('🔍 Tracing scanned product:', lotCode);
            
            // Use the main app to trace the product
            const traceData = await window.foodApp.traceProduct(lotCode);
            
            if (traceData) {
                // Display results
                window.foodApp.displayTraceResults(traceData);
                
                // Add activity to recent activity list
                this.addToRecentActivity(lotCode, traceData.product.name);
            }
            
        } catch (error) {
            console.error('❌ Error tracing scanned product:', error);
            // Error handling is done in the main app
        }
    }

    // Add to recent activity
    addToRecentActivity(lotCode, productName) {
        const activityList = document.getElementById('activity-list');
        
        if (activityList) {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            activityItem.innerHTML = `
                <div class="activity-icon">📱</div>
                <div class="activity-content">
                    <div class="activity-text">QR Scanned: ${productName || 'Product'} (Lot: ${lotCode})</div>
                    <div class="activity-time">${new Date().toLocaleString()}</div>
                </div>
            `;
            
            // Add to top of list
            activityList.insertBefore(activityItem, activityList.firstChild);
            
            // Keep only last 5 activities
            const activities = activityList.children;
            while (activities.length > 5) {
                activityList.removeChild(activities[activities.length - 1]);
            }
        }
    }

    // Generate QR code for a product (bonus feature)
    generateQRCode(lotCode) {
        // This would generate a QR code for a given lot code
        // You could use a library like qrcode.js for this
        const qrData = lotCode.toString();
        console.log('Generated QR data for lot code', lotCode, ':', qrData);
        return qrData;
    }

    // Create a simple QR code display (for demo purposes)
    displayQRCode(lotCode) {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${lotCode}`;
        
        const qrDisplay = document.createElement('div');
        qrDisplay.innerHTML = `
            <div style="text-align: center; margin: 20px; padding: 20px; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <h4>QR Code for Lot ${lotCode}</h4>
                <img src="${qrUrl}" alt="QR Code for lot ${lotCode}" style="border: 1px solid #ddd; padding: 10px;" />
                <p style="margin: 10px 0; font-size: 0.9em; color: #666;">
                    Scan this QR code to trace the product
                </p>
            </div>
        `;
        
        return qrDisplay;
    }
}

// Global scanner instance
window.qrScanner = new QRCodeScanner();

// Add QR code generation utility
window.generateProductQR = function(lotCode) {
    const qrDisplay = window.qrScanner.displayQRCode(lotCode);
    
    // Show in a modal-like display
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        cursor: pointer;
    `;
    
    overlay.appendChild(qrDisplay);
    
    // Click to close
    overlay.addEventListener('click', () => {
        document.body.removeChild(overlay);
    });
    
    document.body.appendChild(overlay);
};