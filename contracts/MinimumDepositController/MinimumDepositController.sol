// SPDX-License-Identifier: MIT

pragma solidity ^0.8.16;

import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {AccessControlEnumerable} from "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import {ILenderVerifier, Status, DepositAllowed} from "../carbon/interfaces/IDepositController.sol";
import {ITrancheVault} from "../carbon/interfaces/ITrancheVault.sol";
import {IMinimumDepositController} from "./IMinimumDepositController.sol";

uint256 constant BASIS_PRECISION = 10000;

contract MinimumDepositController is IMinimumDepositController, Initializable, AccessControlEnumerable {
    /// @dev Manager role used for access control
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    ILenderVerifier public lenderVerifier;
    uint256 public ceiling;
    uint256 public depositFeeRate;
    uint256 public minimumDeposit;

    mapping(Status => bool) public depositAllowed;

    constructor() {}

    function initialize(
        address manager,
        address _lenderVerifier,
        uint256 _depositFeeRate,
        uint256 _minimumDeposit,
        uint256 _ceiling,
        bool _areLiveDepositsAllowed
    ) external initializer {
        _grantRole(MANAGER_ROLE, manager);
        lenderVerifier = ILenderVerifier(_lenderVerifier);
        depositFeeRate = _depositFeeRate;
        minimumDeposit = _minimumDeposit;
        depositAllowed[Status.CapitalFormation] = true;
        depositAllowed[Status.Live] = _areLiveDepositsAllowed;

        ceiling = _ceiling;
    }

    function maxDeposit(address receiver) public view returns (uint256) {
        if (!lenderVerifier.isAllowed(receiver)) {
            return 0;
        }

        ITrancheVault tranche = ITrancheVault(msg.sender);
        if (!depositAllowed[tranche.portfolio().status()]) {
            return 0;
        }

        uint256 totalAssets = tranche.totalAssets();
        if (ceiling <= totalAssets) {
            return 0;
        }
        return ceiling - totalAssets;
    }

    function maxMint(address receiver) external view returns (uint256) {
        return previewDeposit(maxDeposit(receiver));
    }

    function onDeposit(
        address,
        uint256 assets,
        address
    ) external view returns (uint256, uint256) {
        _requireMinimumDeposit(assets);
        uint256 depositFee = _getDepositFee(assets);
        return (previewDeposit(assets), depositFee);
    }

    function onMint(
        address,
        uint256 shares,
        address
    ) external view returns (uint256, uint256) {
        uint256 assets = ITrancheVault(msg.sender).convertToAssetsCeil(shares);
        _requireMinimumDeposit(assets);
        uint256 depositFee = _getDepositFee(assets);
        return (assets, depositFee);
    }

    function previewDeposit(uint256 assets) public view returns (uint256 shares) {
        uint256 depositFee = _getDepositFee(assets);
        return ITrancheVault(msg.sender).convertToShares(assets - depositFee);
    }

    function previewMint(uint256 shares) public view returns (uint256) {
        uint256 assets = ITrancheVault(msg.sender).convertToAssetsCeil(shares);
        uint256 depositFee = _getDepositFee(assets);
        return assets + depositFee;
    }

    function setCeiling(uint256 newCeiling) public {
        _requireManagerRole();
        ceiling = newCeiling;
        emit CeilingChanged(newCeiling);
    }

    function setDepositAllowed(bool newDepositAllowed, Status portfolioStatus) public {
        _requireManagerRole();
        require(portfolioStatus == Status.CapitalFormation || portfolioStatus == Status.Live, "MDC: No custom value in Closed");
        depositAllowed[portfolioStatus] = newDepositAllowed;
        emit DepositAllowedChanged(newDepositAllowed, portfolioStatus);
    }

    function setDepositFeeRate(uint256 newFeeRate) public {
        _requireManagerRole();
        depositFeeRate = newFeeRate;
        emit DepositFeeRateChanged(newFeeRate);
    }

    function setMinimumDeposit(uint256 newMinimumDeposit) public {
        _requireManagerRole();
        minimumDeposit = newMinimumDeposit;
        emit MinimumDepositChanged(newMinimumDeposit);
    }

    function setLenderVerifier(ILenderVerifier newLenderVerifier) public {
        _requireManagerRole();
        lenderVerifier = newLenderVerifier;
        emit LenderVerifierChanged(newLenderVerifier);
    }

    function configure(
        uint256 newCeiling,
        uint256 newFeeRate,
        uint256 newMinimumDeposit,
        ILenderVerifier newLenderVerifier,
        DepositAllowed memory newDepositAllowed
    ) external {
        if (ceiling != newCeiling) {
            setCeiling(newCeiling);
        }
        if (depositFeeRate != newFeeRate) {
            setDepositFeeRate(newFeeRate);
        }
        if (newMinimumDeposit != minimumDeposit) {
            setMinimumDeposit(newMinimumDeposit);
        }
        if (lenderVerifier != newLenderVerifier) {
            setLenderVerifier(newLenderVerifier);
        }
        if (depositAllowed[newDepositAllowed.status] != newDepositAllowed.value) {
            setDepositAllowed(newDepositAllowed.value, newDepositAllowed.status);
        }
    }

    function _getDepositFee(uint256 assets) internal view returns (uint256) {
        return (assets * depositFeeRate) / BASIS_PRECISION;
    }

    function _requireManagerRole() internal view {
        require(hasRole(MANAGER_ROLE, msg.sender), "MDC: Only manager");
    }

    function _requireMinimumDeposit(uint256 assets) internal view {
        require(assets >= minimumDeposit, "MDC: Assets below minimum deposit");
    }
}
