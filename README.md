# 🦐 Minimum deposit controller

## Overview
The minimum-deposit controller is built based on the default deposit controller from carbon-contracts and it is designed to give the portfolio manager the ability to set the minimum value that lenders can deposit.

Minimum deposit value is first initialized by the manager in the `initialize` function and can be changed by calling `setMinimumDeposit` or `configure` function.

## Affected Methods
```solidity
function onDeposit(
    address,
    uint256 assets,
    address
) external view returns (uint256, uint256)
```
Called by TrancheVault in the `deposit` function. Checks if deposit is greater or equal to minimum deposit value and returns number of shares that lender should get and deposit fee that lender should pay.

```solidity
function onMint(
    address,
    uint256 shares,
    address
) external view returns (uint256, uint256)
```
Called by TrancheVault in the `mint` function. Checks if amount of shares converted to assets is greater or equal to minimum deposit value and returns number of assets that should be transferred and deposit fee that lender should pay.

```solidity
function setMinimumDeposit(uint256 newMinimumDeposit) public
```
Sets minimum deposit value and emits event with changed value.

```solidity
function configure(
    uint256 newCeiling,
    uint256 newFeeRate,
    uint256 newMinimumDeposit,
    ILenderVerifier newLenderVerifier,
    DepositAllowed memory newDepositAllowed
) external
```
Allows the manager to change multiple parameters in the deposit controller (ceiling, fee rate, minimum deposit, lender verifier and allowance for deposit).

