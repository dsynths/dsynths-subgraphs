import {Address, BigInt, ethereum, log} from '@graphprotocol/graph-ts'
import {BIG_DECIMAL_ZERO, SCALE} from 'const'
import {MASTER_AGREEMENT_ADDRESS} from '../../constants'
import {
  MasterAgreement,
  MasterAgreement__getPositionResultPositionStruct
} from '../../generated/MasterAgreement/MasterAgreement'
import {Position} from '../../generated/schema'
import {convertAmountToDecimal, getPositionType} from '../helpers'

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
  const fetchedPosition = fetchPosition(positionId)

  let position = new Position(positionId.toHexString())
  position.creationTimestamp = fetchedPosition.creationTimestamp
  position.mutableTimestamp = fetchedPosition.mutableTimestamp
  position.rfqId = rfqId
  position.positionId = positionId
  position.state = 'OPEN'
  position.positionType = getPositionType(fetchedPosition.positionType)
  position.partyA = partyA
  position.partyB = partyB
  position.uuid = fetchedPosition.uuid
  position.currentBalanceUnits = convertAmountToDecimal(currentBalanceUnits, SCALE)
  position.entryPrice = convertAmountToDecimal(entryPrice, SCALE)
  position.exitPrice = BIG_DECIMAL_ZERO
  position.save()

  return position
}

export function updatePositionState(positionId: BigInt, state: string, event: ethereum.Event): Position | null {
  let position = getPosition(positionId)
  if (position) {
    position.state = state
    position.mutableTimestamp = event.block.timestamp
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

function fetchPosition(positionId: BigInt): MasterAgreement__getPositionResultPositionStruct {
  const contract = MasterAgreement.bind(MASTER_AGREEMENT_ADDRESS)
  return contract.getPosition(positionId)
}
