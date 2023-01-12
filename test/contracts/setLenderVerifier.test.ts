import { expect } from 'chai'
import { Wallet } from 'ethers'
import { minimumDepositControllerFixture } from 'fixtures/minimumDepositControllerFixture'
import { setupFixtureLoader } from 'test/setup'

describe('MinimumDepositController.setLenderVerifier', () => {
  const loadFixture = setupFixtureLoader()

  const lenderVerifierAddress = Wallet.createRandom().address

  it('only manager', async () => {
    const { depositController, other } = await loadFixture(minimumDepositControllerFixture)
    await expect(depositController.connect(other).setLenderVerifier(lenderVerifierAddress)).to.be.revertedWith(
      'MDC: Only manager',
    )
  })

  it('sets new lender verifier', async () => {
    const { depositController } = await loadFixture(minimumDepositControllerFixture)
    await depositController.setLenderVerifier(lenderVerifierAddress)
    expect(await depositController.lenderVerifier()).to.eq(lenderVerifierAddress)
  })

  it('emits event', async () => {
    const { depositController } = await loadFixture(minimumDepositControllerFixture)
    await expect(depositController.setLenderVerifier(lenderVerifierAddress))
      .to.emit(depositController, 'LenderVerifierChanged')
      .withArgs(lenderVerifierAddress)
  })
})
