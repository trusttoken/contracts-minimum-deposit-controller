import { expect } from 'chai'
import { Wallet } from 'ethers'
import { minimumDepositControllerFixture } from 'fixtures/minimumDepositControllerFixture'
import { PortfolioStatus } from 'fixtures/structuredPortfolioFixture'
import { setupFixtureLoader } from 'test/setup'

describe('MinimumDepositController.configure', () => {
  const loadFixture = setupFixtureLoader()
  const ceiling = 400
  const depositFeeRate = 100
  const minimumDeposit = 200
  const lenderVerifierAddress = Wallet.createRandom().address

  it('changes multiple values', async () => {
    const { depositController } = await loadFixture(minimumDepositControllerFixture)
    const status = PortfolioStatus.Live
    const depositAllowed = !(await depositController.depositAllowed(status))

    await depositController.configure(ceiling, depositFeeRate, minimumDeposit, lenderVerifierAddress, {
      status,
      value: depositAllowed,
    })

    expect(await depositController.depositAllowed(status)).to.eq(depositAllowed)
    expect(await depositController.ceiling()).to.eq(ceiling)
    expect(await depositController.depositFeeRate()).to.eq(depositFeeRate)
    expect(await depositController.minimumDeposit()).to.eq(minimumDeposit)
    expect(await depositController.lenderVerifier()).to.eq(lenderVerifierAddress)
  })

  it("can be used in closed if deposit allowed doesn't change", async () => {
    const { depositController } = await loadFixture(minimumDepositControllerFixture)
    const status = PortfolioStatus.Closed
    const depositAllowed = await depositController.depositAllowed(status)

    await depositController.configure(ceiling, depositFeeRate, minimumDeposit, lenderVerifierAddress, {
      status,
      value: depositAllowed,
    })

    expect(await depositController.depositAllowed(status)).to.eq(depositAllowed)
    expect(await depositController.ceiling()).to.eq(ceiling)
    expect(await depositController.depositFeeRate()).to.eq(depositFeeRate)
    expect(await depositController.minimumDeposit()).to.eq(minimumDeposit)
    expect(await depositController.lenderVerifier()).to.eq(lenderVerifierAddress)
  })

  it('can be called by anyone when not changing values', async () => {
    const { depositController, other } = await loadFixture(minimumDepositControllerFixture)

    const status = PortfolioStatus.Live
    const ceiling = await depositController.ceiling()
    const depositFeeRate = await depositController.depositFeeRate()
    const minimumDeposit = await depositController.minimumDeposit()
    const lenderVerifierAddress = await depositController.lenderVerifier()
    const depositAllowed = await depositController.depositAllowed(status)

    const controllerAsOther = depositController.connect(other)

    expect(
      await controllerAsOther.configure(ceiling, depositFeeRate, minimumDeposit, lenderVerifierAddress, {
        status,
        value: depositAllowed,
      }),
    ).not.to.be.reverted
  })
})
