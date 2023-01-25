import { MinimumDepositController } from '../build/artifacts'
import { contract, deploy } from 'ethereum-mars'

export function deployContract() {
  const minimumDepositController = contract(MinimumDepositController)
  return { minimumDepositController }
}

deploy({ verify: true }, deployContract)
