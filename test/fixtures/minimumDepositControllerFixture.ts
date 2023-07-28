import { MinimumDepositController__factory } from 'build/types'
import { AllowAllLenderVerifier__factory } from 'build/types/factories/AllowAllLenderVerifier__factory'
import { Wallet } from 'ethers'

export async function minimumDepositControllerFixture([wallet]: Wallet[]) {
  const lenderVerifier = await new AllowAllLenderVerifier__factory(wallet).deploy()
  const depositController = await new MinimumDepositController__factory(wallet).deploy()
  const depositFeeRate = 500
  const minimumDeposit = 100
  await depositController.initialize(wallet.address, lenderVerifier.address, depositFeeRate, minimumDeposit, 0, false)
  return { depositController, depositFeeRate, minimumDeposit, lenderVerifier }
}
