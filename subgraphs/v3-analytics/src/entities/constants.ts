import {BigDecimal, BigInt} from '@graphprotocol/graph-ts'
import {SCALE} from 'const'
import {Constants} from '../../generated/schema'
import {convertAmountToDecimal} from '../helpers'

const CONSTANTS_ID = 'CONSTANTS'
const BIG_DECIMAL_50 = BigDecimal.fromString('50')
const BIG_DECIMAL_100 = BigDecimal.fromString('100')

export function getConstantsEntity(): Constants {
  let constants = Constants.load(CONSTANTS_ID)
  if (!constants) {
    constants = new Constants(CONSTANTS_ID)
    constants.protocolLiquidationSharePercentage = BIG_DECIMAL_50
    constants.save()
  }
  return constants
}

export function onSetProtocolLiquidationShare(multiplier: BigInt): void {
  const percentage = convertAmountToDecimal(multiplier, SCALE).times(BIG_DECIMAL_100)

  let constants = getConstantsEntity()
  constants.protocolLiquidationSharePercentage = percentage
  constants.save()
}

export function calculateProtocolLiquidationShare(liquidationFee: BigDecimal): BigDecimal {
  const constants = getConstantsEntity()
  return liquidationFee.times(constants.protocolLiquidationSharePercentage).div(BIG_DECIMAL_100)
}
