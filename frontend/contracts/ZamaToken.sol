// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/**
 * @title ZamaToken
 * @notice Minimal ERC20 token for demo purposes.
 * - Fixed supply: 1,000,000 ZAMA minted to the contract itself on deploy.
 * - Transfer limit: max 10 ZAMA per transfer / transferFrom.
 * - Faucet: each address can receive up to 10 ZAMA total from the faucet.
 */
contract ZamaToken {
    string public constant name = "Zama Token";
    string public constant symbol = "ZAMA";
    uint8 public constant decimals = 18;

    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 1e18;
    uint256 public constant MAX_TRANSFER = 10 * 1e18;
    uint256 public constant MAX_FAUCET_PER_ADDRESS = 10 * 1e18;

    address public immutable owner;

    uint256 public totalSupply;

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    mapping(address => uint256) public faucetClaimed;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event Faucet(address indexed to, uint256 value);

    error NotOwner();
    error InvalidAddress();
    error TransferTooLarge();
    error InsufficientBalance();
    error InsufficientAllowance();
    error FaucetLimitExceeded();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor() {
        owner = msg.sender;
        _mint(address(this), INITIAL_SUPPLY);
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function allowance(address tokenOwner, address spender) external view returns (uint256) {
        return _allowances[tokenOwner][spender];
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        if (spender == address(0)) revert InvalidAddress();
        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _enforceTransferLimit(amount);
        _transfer(msg.sender, to, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        _enforceTransferLimit(amount);

        uint256 currentAllowance = _allowances[from][msg.sender];
        if (currentAllowance < amount) revert InsufficientAllowance();
        unchecked {
            _allowances[from][msg.sender] = currentAllowance - amount;
        }
        emit Approval(from, msg.sender, _allowances[from][msg.sender]);

        _transfer(from, to, amount);
        return true;
    }

    /**
     * @notice Faucet: caller can receive up to 10 ZAMA total (lifetime).
     * @dev Tokens are transferred from the contract's own balance.
     */
    function faucet(uint256 amount) external returns (bool) {
        if (amount == 0) return true;
        if (amount > MAX_FAUCET_PER_ADDRESS) revert FaucetLimitExceeded();

        uint256 claimed = faucetClaimed[msg.sender];
        if (claimed + amount > MAX_FAUCET_PER_ADDRESS) revert FaucetLimitExceeded();
        faucetClaimed[msg.sender] = claimed + amount;

        // faucet transfers also respect MAX_TRANSFER (10 ZAMA), which matches the faucet cap.
        _transfer(address(this), msg.sender, amount);
        emit Faucet(msg.sender, amount);
        return true;
    }

    /**
     * @notice Optional: move tokens out of the contract reserve.
     * @dev Still subject to MAX_TRANSFER per transaction.
     */
    function ownerTransfer(address to, uint256 amount) external onlyOwner returns (bool) {
        _enforceTransferLimit(amount);
        _transfer(address(this), to, amount);
        return true;
    }

    function _enforceTransferLimit(uint256 amount) internal pure {
        if (amount > MAX_TRANSFER) revert TransferTooLarge();
    }

    function _transfer(address from, address to, uint256 amount) internal {
        if (to == address(0)) revert InvalidAddress();

        uint256 fromBal = _balances[from];
        if (fromBal < amount) revert InsufficientBalance();

        unchecked {
            _balances[from] = fromBal - amount;
            _balances[to] += amount;
        }

        emit Transfer(from, to, amount);
    }

    function _mint(address to, uint256 amount) internal {
        if (to == address(0)) revert InvalidAddress();
        totalSupply += amount;
        unchecked {
            _balances[to] += amount;
        }
        emit Transfer(address(0), to, amount);
    }
}
