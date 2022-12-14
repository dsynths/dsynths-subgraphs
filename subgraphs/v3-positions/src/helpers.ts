import {BigDecimal, BigInt} from '@graphprotocol/graph-ts'
import {BIG_INT_ZERO, BIG_INT_ONE, BIG_DECIMAL_ZERO} from 'const'

export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
  let bd = BigDecimal.fromString('1')
  for (let i = BIG_INT_ZERO; i.lt(decimals as BigInt); i = i.plus(BIG_INT_ONE)) {
    bd = bd.times(BigDecimal.fromString('10'))
  }
  return bd
}

export function convertAmountToDecimal(amount: BigInt, decimals: BigInt): BigDecimal {
  if (decimals == BIG_INT_ZERO) {
    return amount.toBigDecimal()
  }
  return amount.toBigDecimal().div(exponentToBigDecimal(decimals))
}

export function removeFromArray(arr: string[], item: string): string[] {
  let result: string[] = []
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] != item) {
      result.push(arr[i])
    }
  }
  return result
}

export function getPositionType(positionType: number): string {
  if (positionType == 0) {
    return 'ISOLATED'
  } else {
    return 'CROSS'
  }
}

export function getOrderType(orderType: number): string {
  if (orderType == 0) {
    return 'LIMIT'
  } else {
    return 'MARKET'
  }
}

export function getHedgerMode(hedgerMode: number): string {
  if (hedgerMode == 0) {
    return 'SINGLE'
  } else if (hedgerMode == 1) {
    return 'HYBRID'
  } else {
    return 'AUTO'
  }
}
