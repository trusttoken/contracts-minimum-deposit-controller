import { expect } from 'chai'
import { minimumDepositControllerFixture } from 'fixtures/minimumDepositControllerFixture'
import { setupFixtureLoader } from 'test/setup'

describe('MinimumDepositController.setMinimumDeposit', () => {
  const loadFixture = setupFixtureLoader()

  it('only manager', async () => {
    const { depositController, other } = await loadFixture(minimumDepositControllerFixture)
    await expect(depositController.connect(other).setMinimumDeposit(1000)).to.be.revertedWith('MDC: Only manager')
  })

  it('sets new value', async () => {
    const { depositController } = await loadFixture(minimumDepositControllerFixture)
    const minimumDeposit = 1000
    await depositController.setMinimumDeposit(minimumDeposit)
    expect(await depositController.minimumDeposit()).to.eq(minimumDeposit)
  })

  it('emits event', async () => {
    const { depositController } = await loadFixture(minimumDepositControllerFixture)
    const minimumDeposit = 1000
    await expect(depositController.setMinimumDeposit(minimumDeposit))
      .to.emit(depositController, 'MinimumDepositChanged')
      .withArgs(minimumDeposit)
  })
})
