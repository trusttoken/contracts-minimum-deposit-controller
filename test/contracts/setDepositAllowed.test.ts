import { expect } from 'chai'
import { minimumDepositControllerFixture } from 'fixtures/minimumDepositControllerFixture'
import { PortfolioStatus } from 'fixtures/structuredPortfolioFixture'
import { setupFixtureLoader } from 'test/setup'

describe('MinimumDepositController.setDepositAllowed', () => {
  const loadFixture = setupFixtureLoader()

  it('emits event', async () => {
    const { depositController } = await loadFixture(minimumDepositControllerFixture)
    const newValue = true
    const status = PortfolioStatus.CapitalFormation
    await expect(depositController.setDepositAllowed(newValue, status))
      .to.emit(depositController, 'DepositAllowedChanged')
      .withArgs(newValue, status)
  })

  it('only manager', async () => {
    const { depositController, other } = await loadFixture(minimumDepositControllerFixture)
    await expect(
      depositController.connect(other).setDepositAllowed(true, PortfolioStatus.CapitalFormation),
    ).to.be.revertedWith('MDC: Only manager')
  })

  it('no custom value in closed', async () => {
    const { depositController } = await loadFixture(minimumDepositControllerFixture)
    await expect(depositController.setDepositAllowed(true, PortfolioStatus.Closed)).to.be.revertedWith(
      'MDC: No custom value in Closed',
    )
  })

  it('changes value', async () => {
    const { depositController } = await loadFixture(minimumDepositControllerFixture)
    const newValue = true
    const status = PortfolioStatus.Live

    await depositController.setDepositAllowed(newValue, status)

    const depositAllowed = await depositController.depositAllowed(status)

    expect(depositAllowed).to.eq(newValue)
  })
})
