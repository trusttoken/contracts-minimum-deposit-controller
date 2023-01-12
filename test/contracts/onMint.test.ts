import { setupFixtureLoader } from 'test/setup'
import { structuredPortfolioFixture } from 'fixtures/structuredPortfolioFixture'
import { parseUSDC } from 'utils'
import { expect } from 'chai'

describe('MinimumDepositController.onMint', () => {
  const loadFixture = setupFixtureLoader()
  const minimumDeposit = parseUSDC(100)

  it('cannot mint below minimum deposit value', async () => {
    const { equityTranche, mintToTranche } = await loadFixture(structuredPortfolioFixture(minimumDeposit))
    await expect(mintToTranche(equityTranche, parseUSDC(10))).to.be.revertedWith('MDC: Assets below minimum deposit')
  })

  it('mints shares equal to minimum deposit value', async () => {
    const { equityTranche, mintToTranche, token } = await loadFixture(structuredPortfolioFixture(minimumDeposit))
    const amount = await equityTranche.convertToShares(minimumDeposit)

    await mintToTranche(equityTranche, amount)
    expect(await token.balanceOf(equityTranche.address)).to.eq(amount)
  })

  it('mints shares for share amount above minimum deposit value', async () => {
    const { equityTranche, mintToTranche, token } = await loadFixture(structuredPortfolioFixture(minimumDeposit))
    const amount = await equityTranche.convertToShares(parseUSDC(150))

    await mintToTranche(equityTranche, amount)
    expect(await token.balanceOf(equityTranche.address)).to.eq(amount)
  })
})
