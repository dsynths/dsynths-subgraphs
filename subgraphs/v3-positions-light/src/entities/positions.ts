import {Address, BigInt} from '@graphprotocol/graph-ts'
import {BIG_DECIMAL_ZERO, SCALE} from 'const'
import {Position} from '../../generated/schema'
import {convertAmountToDecimal} from '../helpers'

export function getPosition(positionId: BigInt): Position | null {
  return Position.load(positionId.toHexString())
}

export function createPosition(
  rfqId: BigInt,
  positionId: BigInt,
  partyA: Address,
  partyB: Address,
  currentBalanceUnits: BigInt,
  entryPrice: BigInt
): Position {
  let position = new Position(positionId.toHexString())
  position.rfqId = rfqId
  position.positionId = positionId
  position.state = 'OPEN'
  position.partyA = partyA
  position.partyB = partyB
  position.currentBalanceUnits = convertAmountToDecimal(currentBalanceUnits, SCALE)
  position.entryPrice = convertAmountToDecimal(entryPrice, SCALE)
  position.exitPrice = BIG_DECIMAL_ZERO
  position.save()
  return position
}

export function updatePositionState(positionId: BigInt, state: string): Position | null {
  let position = getPosition(positionId)
  if (position) {
    position.state = state
    position.save()
  }
  return position
}

export function updatePositionBalance(positionId: BigInt, closedUnits: BigInt): Position | null {
  let position = getPosition(positionId)
  if (position) {
    position.currentBalanceUnits = position.currentBalanceUnits.minus(convertAmountToDecimal(closedUnits, SCALE))
    position.save()
  }
  return position
}

export function updatePositionExitPrice(positionId: BigInt, exitPrice: BigInt): Position | null {
  let position = getPosition(positionId)
  if (position) {
    position.exitPrice = convertAmountToDecimal(exitPrice, SCALE)
    position.save()
  }
  return position
}
