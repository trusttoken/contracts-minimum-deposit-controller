import { setupFixtureLoader } from 'test/setup'
import { structuredPortfolioFixture } from 'fixtures/structuredPortfolioFixture'
import { parseUSDC } from 'utils'
import { expect } from 'chai'

describe('MinimumDepositController.onDeposit', () => {
  const loadFixture = setupFixtureLoader()
  const minimumDeposit = parseUSDC(100)

  it('cannot deposit below minimum deposit value', async () => {
    const { equityTranche, depositToTranche } = await loadFixture(structuredPortfolioFixture(minimumDeposit))
    await expect(depositToTranche(equityTranche, parseUSDC(50))).to.be.revertedWith('MDC: Assets below minimum deposit')
  })

  it('makes deposit with minimum deposit value', async () => {
    const { equityTranche, depositToTranche, token } = await loadFixture(structuredPortfolioFixture(minimumDeposit))
    await depositToTranche(equityTranche, minimumDeposit)
    expect(await token.balanceOf(equityTranche.address)).to.eq(minimumDeposit)
  })

  it('makes deposit with value greater than minimum deposit', async () => {
    const { equityTranche, depositToTranche, token } = await loadFixture(structuredPortfolioFixture(minimumDeposit))
    const amount = parseUSDC(150)

    await depositToTranche(equityTranche, amount)
    expect(await token.balanceOf(equityTranche.address)).to.eq(amount)
  })
})
