import { expect } from 'chai'
import { minimumDepositControllerFixture } from 'fixtures/minimumDepositControllerFixture'
import { PortfolioStatus } from 'fixtures/structuredPortfolioFixture'
import { setupFixtureLoader } from 'test/setup'

describe('MinimumDepositController.initialize', () => {
  const loadFixture = setupFixtureLoader()

  it('grants manager role', async () => {
    const { depositController, wallet } = await loadFixture(minimumDepositControllerFixture)
    const managerRole = await depositController.MANAGER_ROLE()
    expect(await depositController.hasRole(managerRole, wallet.address)).to.be.true
  })

  it('sets deposit fee rate', async () => {
    const { depositController, depositFeeRate } = await loadFixture(minimumDepositControllerFixture)
    expect(await depositController.depositFeeRate()).to.eq(depositFeeRate)
  })

  it('sets minimum deposit', async () => {
    const { depositController, minimumDeposit } = await loadFixture(minimumDepositControllerFixture)
    expect(await depositController.minimumDeposit()).to.eq(minimumDeposit)
  })

  it('sets lender verifier', async () => {
    const { depositController, lenderVerifier } = await loadFixture(minimumDepositControllerFixture)
    expect(await depositController.lenderVerifier()).to.eq(lenderVerifier.address)
  })

  it('sets default deposit allowed', async () => {
    const TEST_DATA = [
      {
        status: PortfolioStatus.CapitalFormation,
        defaultValue: true,
      },
      {
        status: PortfolioStatus.Live,
        defaultValue: false,
      },
      {
        status: PortfolioStatus.Closed,
        defaultValue: false,
      },
    ]

    const { depositController } = await loadFixture(minimumDepositControllerFixture)

    for (const { status, defaultValue } of TEST_DATA) {
      expect(await depositController.depositAllowed(status)).to.deep.eq(defaultValue)
    }
  })
})
