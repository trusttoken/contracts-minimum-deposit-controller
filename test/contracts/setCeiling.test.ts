import { expect } from 'chai'
import { minimumDepositControllerFixture } from 'fixtures/minimumDepositControllerFixture'
import { setupFixtureLoader } from 'test/setup'

describe('MinimumDepositController.setCeiling', () => {
  const loadFixture = setupFixtureLoader()

  it('only manager', async () => {
    const { depositController, other } = await loadFixture(minimumDepositControllerFixture)
    await expect(depositController.connect(other).setCeiling(1000)).to.be.revertedWith('MDC: Only manager')
  })

  it('sets new value', async () => {
    const { depositController } = await loadFixture(minimumDepositControllerFixture)
    const ceiling = 1000
    await depositController.setCeiling(ceiling)
    expect(await depositController.ceiling()).to.eq(ceiling)
  })

  it('emits event', async () => {
    const { depositController } = await loadFixture(minimumDepositControllerFixture)
    const ceiling = 1000
    await expect(depositController.setCeiling(ceiling)).to.emit(depositController, 'CeilingChanged').withArgs(ceiling)
  })
})
