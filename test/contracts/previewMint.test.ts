import { setupFixtureLoader } from 'test/setup'
import { structuredPortfolioFixture } from 'fixtures/structuredPortfolioFixture'
import { parseUSDC } from 'utils'
import { expect } from 'chai'

describe('MinimumDepositController.previewMint', () => {
  const loadFixture = setupFixtureLoader()
  const minimumDeposit = parseUSDC(100)

  it('previews the mint amount', async () => {
    const { equityTranche } = await loadFixture(structuredPortfolioFixture(minimumDeposit))
    const amount = parseUSDC(100)

    expect(await equityTranche.previewMint(amount)).to.eq(amount)
  })
})
