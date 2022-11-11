import {BigDecimal, BigInt} from '@graphprotocol/graph-ts'
import {BIG_INT_ZERO, BIG_INT_ONE} from 'const'

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

export function getRequestForQuoteState(state: number): string {
  if (state == 0) {
    return 'ORPHAN'
  } else if (state == 1) {
    return 'CANCELATION_REQUESTED'
  } else if (state == 2) {
    return 'CANCELED'
  } else if (state == 3) {
    return 'REJECTED'
  } else {
    return 'ACCEPTED'
  }
}

export function getPositionState(state: number): string {
  if (state == 0) {
    return 'OPEN'
  } else if (state == 1) {
    return 'MARKET_CLOSE_REQUESTED'
  } else if (state == 2) {
    return 'MARKET_CLOSE_CANCELATION_REQUESTED'
  } else if (state == 3) {
    return 'LIMIT_CLOSE_REQUESTED'
  } else if (state == 4) {
    return 'LIMIT_CLOSE_CANCELATION_REQUESTED'
  } else if (state == 5) {
    return 'LIMIT_CLOSE_ACTIVE'
  } else if (state == 6) {
    return 'CLOSED'
  } else {
    return 'LIQUIDATED'
  }
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

export function getSide(side: number): string {
  if (side == 0) {
    return 'BUY'
  } else {
    return 'SELL'
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

export function getMarketType(marketType: number): string {
  if (marketType == 0) {
    return 'FOREX'
  } else if (marketType == 1) {
    return 'CRYPTO'
  } else {
    return 'STOCK'
  }
}

export function getTradingSession(tradingSession: number): string {
  if (tradingSession == 0) {
    return '_24_7'
  } else {
    return '_24_5'
  }
}
