import {BigDecimal, BigInt, ethereum} from '@graphprotocol/graph-ts'
import {BIG_DECIMAL_ZERO, SCALE} from 'const'
import {MASTER_AGREEMENT_ADDRESS} from '../../constants'
import {
  MasterAgreement,
  MasterAgreement__getPositionResultPositionStruct
} from '../../generated/MasterAgreement/MasterAgreement'
import {Position, PositionSnapshot} from '../../generated/schema'
import {convertAmountToDecimal} from '../helpers'

function generateSnapshotID(positionId: BigInt, event: ethereum.Event): string {
  return `${positionId.toHexString()}-${event.transaction.hash.toHexString()}-${event.transactionLogIndex.toHexString()}`
}

function getPosition(positionId: BigInt): Position | null {
  return Position.load(positionId.toHexString())
}

export function createPositionGenesis(positionId: BigInt, snapshotIdGenesis: string): Position {
  let position = new Position(positionId.toHexString())
  position.lastSnapshotId = snapshotIdGenesis
  position.save()
  return position
}

export function updatePositionLastSnapshot(positionId: BigInt, snapshotId: string): void {
  let position = getPosition(positionId)
  if (!position) return
  position.lastSnapshotId = snapshotId
  position.save()
}

export function getLastPositionSnapshot(positionId: BigInt): PositionSnapshot | null {
  const position = getPosition(positionId)
  if (!position) return null
  return PositionSnapshot.load(position.lastSnapshotId)
}

export function createPositionSnapshot(
  positionId: BigInt,
  entryPrice: BigDecimal,
  event: ethereum.Event
): PositionSnapshot {
  const position = new PositionSnapshot(generateSnapshotID(positionId, event))
  const fetchedPosition = fetchPosition(positionId)

  position.timestamp = event.block.timestamp
  position.positionId = positionId
  position.marketId = fetchedPosition.marketId
  position.partyA = fetchedPosition.partyA
  position.partyB = fetchedPosition.partyB
  position.oldState = 'OPEN'
  position.newState = 'OPEN'
  position.oldBalanceUnits = convertAmountToDecimal(fetchedPosition.currentBalanceUnits, SCALE)
  position.newBalanceUnits = convertAmountToDecimal(fetchedPosition.currentBalanceUnits, SCALE)
  position.entryPrice = entryPrice
  position.exitPrice = BIG_DECIMAL_ZERO
  position.oldLockedMarginA = convertAmountToDecimal(fetchedPosition.lockedMarginA, SCALE)
  position.newLockedMarginA = convertAmountToDecimal(fetchedPosition.lockedMarginA, SCALE)
  position.oldLockedMarginB = convertAmountToDecimal(fetchedPosition.lockedMarginB, SCALE)
  position.newLockedMarginB = convertAmountToDecimal(fetchedPosition.lockedMarginB, SCALE)

  position.save()
  return position
}

export function createPositionSnapshotMarketCloseRequested(
  lastSnapshot: PositionSnapshot,
  event: ethereum.Event
): PositionSnapshot {
  // Ignore sequential requests to close a position
  if (lastSnapshot.newState == 'MARKET_CLOSE_REQUESTED') return lastSnapshot

  let position = createPositionSnapshot(lastSnapshot.positionId, lastSnapshot.entryPrice, event)
  // Override fields
  position.oldState = lastSnapshot.newState
  position.newState = 'MARKET_CLOSE_REQUESTED'
  position.save()

  return position
}

export function createPositionSnapshotCancelClosePosition(
  lastSnapshot: PositionSnapshot,
  event: ethereum.Event
): PositionSnapshot {
  let position = createPositionSnapshot(lastSnapshot.positionId, lastSnapshot.entryPrice, event)
  // Override fields
  position.oldState = lastSnapshot.newState
  position.newState = 'OPEN'
  position.save()

  return position
}

export function createPositionSnapshotClosePosition(
  lastSnapshot: PositionSnapshot,
  exitPrice: BigInt,
  event: ethereum.Event
): PositionSnapshot {
  let position = createPositionSnapshot(lastSnapshot.positionId, lastSnapshot.entryPrice, event)
  // Override fields
  position.oldState = lastSnapshot.newState
  position.newState = 'CLOSED'
  position.oldBalanceUnits = lastSnapshot.newBalanceUnits
  position.newBalanceUnits = BIG_DECIMAL_ZERO
  position.exitPrice = convertAmountToDecimal(exitPrice, SCALE)
  position.save()

  return position
}

export function createPositionSnapshotLiquidate(
  lastSnapshot: PositionSnapshot,
  exitPrice: BigInt,
  event: ethereum.Event
): PositionSnapshot {
  let position = createPositionSnapshot(lastSnapshot.positionId, lastSnapshot.entryPrice, event)
  // Override fields
  position.oldState = lastSnapshot.newState
  position.newState = 'LIQUIDATED'
  position.oldBalanceUnits = lastSnapshot.newBalanceUnits
  position.newBalanceUnits = BIG_DECIMAL_ZERO
  position.exitPrice = convertAmountToDecimal(exitPrice, SCALE)
  position.save()

  return position
}

function fetchPosition(positionId: BigInt): MasterAgreement__getPositionResultPositionStruct {
  const contract = MasterAgreement.bind(MASTER_AGREEMENT_ADDRESS)
  return contract.getPosition(positionId)
}
