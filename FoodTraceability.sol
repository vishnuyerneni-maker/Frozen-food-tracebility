// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FoodTraceability {
    
    struct Product {
        string productId;
        uint256 lotCode;
        string name;
        string origin;
        address currentOwner;
        uint256 timestamp;
        bool exists;
    }
    
    struct TraceStep {
        address handler;
        string location;
        uint256 timestamp;
        string action;
    }
    
    mapping(uint256 => Product) public products;
    mapping(uint256 => TraceStep[]) public traceHistory;
    
    uint256 public productCount;
    
    event ProductCreated(uint256 indexed lotCode, string productId, string name);
    event ProductTransferred(uint256 indexed lotCode, address indexed from, address indexed to);
    event TraceStepAdded(uint256 indexed lotCode, string action, string location);
    
    function createProduct(
        string memory _productId,
        uint256 _lotCode,
        string memory _name,
        string memory _origin
    ) public {
        require(!products[_lotCode].exists, "Product already exists");
        
        products[_lotCode] = Product({
            productId: _productId,
            lotCode: _lotCode,
            name: _name,
            origin: _origin,
            currentOwner: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });
        
        // Add initial trace step
        traceHistory[_lotCode].push(TraceStep({
            handler: msg.sender,
            location: _origin,
            timestamp: block.timestamp,
            action: "Created"
        }));
        
        productCount++;
        emit ProductCreated(_lotCode, _productId, _name);
    }
    
    function transferProduct(uint256 _lotCode, string memory _location, string memory _action) public {
        require(products[_lotCode].exists, "Product does not exist");
        
        address previousOwner = products[_lotCode].currentOwner;
        products[_lotCode].currentOwner = msg.sender;
        
        traceHistory[_lotCode].push(TraceStep({
            handler: msg.sender,
            location: _location,
            timestamp: block.timestamp,
            action: _action
        }));
        
        emit ProductTransferred(_lotCode, previousOwner, msg.sender);
        emit TraceStepAdded(_lotCode, _action, _location);
    }
    
    function getProduct(uint256 _lotCode) public view returns (
        string memory productId,
        string memory name,
        string memory origin,
        address currentOwner,
        uint256 timestamp
    ) {
        Product memory product = products[_lotCode];
        return (
            product.productId,
            product.name,
            product.origin,
            product.currentOwner,
            product.timestamp
        );
    }
    
    function getTraceHistory(uint256 _lotCode) public view returns (
        address[] memory handlers,
        string[] memory locations,
        uint256[] memory timestamps,
        string[] memory actions
    ) {
        TraceStep[] memory history = traceHistory[_lotCode];
        
        handlers = new address[](history.length);
        locations = new string[](history.length);
        timestamps = new uint256[](history.length);
        actions = new string[](history.length);
        
        for (uint i = 0; i < history.length; i++) {
            handlers[i] = history[i].handler;
            locations[i] = history[i].location;
            timestamps[i] = history[i].timestamp;
            actions[i] = history[i].action;
        }
        
        return (handlers, locations, timestamps, actions);
    }
    
    function getTotalProducts() public view returns (uint256) {
        return productCount;
    }
}
