import { MinimumDepositController, TrancheVaultTest, WithdrawController } from 'build/types'
import { BigNumber, BigNumberish, constants, Wallet } from 'ethers'
import { getStructuredPortfolioFactoryFixture, TrancheData } from './structuredPortfolioFactoryFixture'
import { setupLoansManagerHelpers } from './setupLoansManagerHelpers'
import { YEAR } from 'utils/constants'
import { timeTravel } from 'utils/timeTravel'
import { getTxTimestamp } from 'utils/getTxTimestamp'
import { sum } from 'utils/sum'
import { MockProvider } from 'ethereum-waffle'
import { parseBPS } from 'utils'

interface FixtureTrancheData extends TrancheData {
  initialDeposit: BigNumber
  trancheIdx: number
  calculateTargetValue: (yearDivider?: number) => BigNumber
}

export enum PortfolioStatus {
  CapitalFormation,
  Live,
  Closed,
}

const getStructuredPortfolioFixture = (tokenDecimals: number, minimumDeposit?: BigNumberish) => {
  return async ([wallet, other, ...rest]: Wallet[], provider: MockProvider) => {
    const factoryFixtureResult = await getStructuredPortfolioFactoryFixture(
      tokenDecimals,
      minimumDeposit,
    )([wallet, other, ...rest])
    const { portfolioDuration, getPortfolioFromTx, tranches, tranchesData, fixedInterestOnlyLoans, token } =
      factoryFixtureResult

    const structuredPortfolio = await getPortfolioFromTx()

    function withdrawFromTranche(
      tranche: TrancheVaultTest,
      amount: BigNumberish,
      owner = wallet.address,
      receiver = wallet.address,
    ) {
      return tranche.withdraw(amount, receiver, owner)
    }

    function redeemFromTranche(
      tranche: TrancheVaultTest,
      amount: BigNumberish,
      owner = wallet.address,
      receiver = wallet.address,
    ) {
      return tranche.redeem(amount, receiver, owner)
    }

    async function setDepositAllowed(
      controller: MinimumDepositController,
      value: boolean,
      portfolio = structuredPortfolio,
    ) {
      await controller.setDepositAllowed(value, await portfolio.status())
    }

    async function setWithdrawAllowed(controller: WithdrawController, value: boolean, portfolio = structuredPortfolio) {
      await controller.setWithdrawAllowed(value, await portfolio.status())
    }

    async function startPortfolioAndEnableLiveActions() {
      const tx = await structuredPortfolio.start()
      for (const trancheData of tranchesData) {
        await setDepositAllowed(trancheData.depositController, true)
        // await setWithdrawAllowed(trancheData.withdrawController, true)
      }
      return tx
    }

    async function startAndClosePortfolio() {
      await structuredPortfolio.start()
      await timeTravel(provider, portfolioDuration)
      await structuredPortfolio.close()
    }

    async function mintToPortfolio(amount: BigNumberish, portfolio = structuredPortfolio) {
      await token.mint(portfolio.address, amount)
      await portfolio.mockIncreaseVirtualTokenBalance(amount)
    }

    async function burnFromPortfolio(amount: BigNumberish, portfolio = structuredPortfolio) {
      await token.burn(portfolio.address, amount)
      await portfolio.mockDecreaseVirtualTokenBalance(amount)
    }

    async function increaseAssetsInTranche(tranche: TrancheVaultTest, amount: BigNumberish) {
      await token.mint(tranche.address, amount)
      await tranche.mockIncreaseVirtualTokenBalance(amount)
    }

    async function decreaseAssetsInTranche(tranche: TrancheVaultTest, amount: BigNumberish) {
      await token.burn(tranche.address, amount)
      await tranche.mockDecreaseVirtualTokenBalance(amount)
    }

    function withInterest(initialAmount: BigNumberish, apy: number, period: number) {
      const initialAmountBN = BigNumber.from(initialAmount)
      const yearlyInterest = initialAmountBN.mul(apy).div(parseBPS(100))
      const periodInterest = yearlyInterest.mul(period).div(YEAR)
      return initialAmountBN.add(periodInterest)
    }

    const [equityTranche, juniorTranche, seniorTranche] = tranches

    const loansManagerHelpers = await setupLoansManagerHelpers(
      structuredPortfolio,
      fixedInterestOnlyLoans,
      other,
      token,
    )

    return {
      structuredPortfolio,
      ...loansManagerHelpers,
      PortfolioStatus,
      withdrawFromTranche,
      redeemFromTranche,
      startAndClosePortfolio,
      startPortfolioAndEnableLiveActions,
      ...factoryFixtureResult,
      equityTranche,
      juniorTranche,
      seniorTranche,
      withInterest,
      setDepositAllowed,
      setWithdrawAllowed,
      mintToPortfolio,
      burnFromPortfolio,
      increaseAssetsInTranche,
      decreaseAssetsInTranche,
    }
  }
}

export const structuredPortfolioFixture = (minimumDeposit?: BigNumberish) =>
  getStructuredPortfolioFixture(6, minimumDeposit)

export const getStructuredPortfolioLiveFixture = (tokenDecimals: number, minimumDeposit: BigNumberish) => {
  return async ([wallet, borrower, ...rest]: Wallet[], provider: MockProvider) => {
    const portfolioFixtureResult = await getStructuredPortfolioFixture(tokenDecimals, minimumDeposit)(
      [wallet, borrower, ...rest],
      provider,
    )
    const {
      tranches,
      depositToTranche,
      parseTokenUnits,
      tranchesData,
      withInterest,
      startPortfolioAndEnableLiveActions,
    } = portfolioFixtureResult

    const initialDeposits = [2e6, 3e6, 5e6].map(parseTokenUnits)
    const totalDeposit = sum(...initialDeposits)
    for (let i = 0; i < tranches.length; i++) {
      await depositToTranche(tranches[i], initialDeposits[i])
    }

    const portfolioStartTx = await startPortfolioAndEnableLiveActions()
    const portfolioStartTimestamp = await getTxTimestamp(portfolioStartTx, provider)

    function calculateTargetTrancheValue(trancheIdx: number, yearDivider = 1) {
      if (trancheIdx === 0) {
        return constants.Zero
      }
      const { targetApy } = tranchesData[trancheIdx]
      const initialDeposit = initialDeposits[trancheIdx]
      return withInterest(initialDeposit, targetApy, YEAR / yearDivider)
    }

    const getTrancheData = (trancheIdx: number): FixtureTrancheData => ({
      ...tranchesData[trancheIdx],
      initialDeposit: initialDeposits[trancheIdx],
      trancheIdx,
      calculateTargetValue: (yearDivider?: number) => calculateTargetTrancheValue(trancheIdx, yearDivider),
    })

    const senior = getTrancheData(2)
    const junior = getTrancheData(1)
    const equity = getTrancheData(0)

    return {
      ...portfolioFixtureResult,
      calculateTargetTrancheValue,
      withInterest,
      initialDeposits,
      senior,
      junior,
      equity,
      portfolioStartTx,
      portfolioStartTimestamp,
      totalDeposit,
    }
  }
}

export const structuredPortfolioLiveFixture = getStructuredPortfolioLiveFixture(6)
