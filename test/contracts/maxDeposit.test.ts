import { setupFixtureLoader } from 'test/setup'
import { PortfolioStatus, structuredPortfolioFixture } from 'fixtures/structuredPortfolioFixture'
import { parseUSDC } from 'utils'
import { expect } from 'chai'
import { MinimumDepositController__factory } from 'build/types'

describe('MinimumDepositController.maxDeposit', () => {
  const loadFixture = setupFixtureLoader()
  const minimumDeposit = parseUSDC(100)
  const ceiling = parseUSDC(5e9)

  it('previews max deposit', async () => {
    const { equityTranche, wallet } = await loadFixture(structuredPortfolioFixture(minimumDeposit))

    expect(await equityTranche.maxDeposit(wallet.address)).to.eq(ceiling)
  })

  it('previews current max deposit', async () => {
    const { equityTranche, wallet, depositToTranche } = await loadFixture(structuredPortfolioFixture(minimumDeposit))
    await depositToTranche(equityTranche, minimumDeposit)

    expect(await equityTranche.maxDeposit(wallet.address)).to.eq(ceiling.sub(minimumDeposit))
  })

  it('returns zero if deposit is not allowed', async () => {
    const { equityTranche, wallet } = await loadFixture(structuredPortfolioFixture(minimumDeposit))
    const depositController = MinimumDepositController__factory.connect(await equityTranche.depositController(), wallet)
    await depositController.setDepositAllowed(false, PortfolioStatus.CapitalFormation)

    expect(await equityTranche.maxDeposit(wallet.address)).to.eq(0)
  })

  it('returns zero if tranche is full', async () => {
    const { equityTranche, wallet, depositToTranche } = await loadFixture(structuredPortfolioFixture(minimumDeposit))
    const depositController = MinimumDepositController__factory.connect(await equityTranche.depositController(), wallet)
    const amount = parseUSDC(150)
    await depositController.setCeiling(amount)
    await depositToTranche(equityTranche, amount)

    expect(await equityTranche.maxDeposit(wallet.address)).to.eq(0)
  })
})
