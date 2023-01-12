import { expect } from 'chai'
import { minimumDepositControllerFixture } from 'fixtures/minimumDepositControllerFixture'
import { setupFixtureLoader } from 'test/setup'

describe('MinimumDepositController.setDepositFeeRate', () => {
  const loadFixture = setupFixtureLoader()

  it('only manager', async () => {
    const { depositController, other } = await loadFixture(minimumDepositControllerFixture)
    await expect(depositController.connect(other).setDepositFeeRate(100)).to.be.revertedWith('MDC: Only manager')
  })

  it('sets new deposit fee rate', async () => {
    const { depositController } = await loadFixture(minimumDepositControllerFixture)
    const depositFeeRate = 100
    await depositController.setDepositFeeRate(depositFeeRate)
    expect(await depositController.depositFeeRate()).to.eq(depositFeeRate)
  })

  it('emits event', async () => {
    const { depositController } = await loadFixture(minimumDepositControllerFixture)
    const depositFeeRate = 100
    await expect(depositController.setDepositFeeRate(depositFeeRate))
      .to.emit(depositController, 'DepositFeeRateChanged')
      .withArgs(depositFeeRate)
  })
})
