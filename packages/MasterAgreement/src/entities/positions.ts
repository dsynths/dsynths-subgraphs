import {BigInt, ethereum} from '@graphprotocol/graph-ts'
import {SCALE} from 'const'

import {
  MasterAgreement,
  MasterAgreement__getPositionResultPositionStruct
} from '../../generated/MasterAgreement/MasterAgreement'
import {Position} from '../../generated/schema'
import {getUser} from './user'

import {MASTER_AGREEMENT_ADDRESS} from '../../constants'
import {convertAmountToDecimal, getPositionState, getPositionType, getSide} from '../helpers'
import {createFill} from './fill'

export function onOpenPosition(rfqId: BigInt, positionId: BigInt, event: ethereum.Event): void {
  const fetchedPosition = fetchPosition(positionId)

  // Create the position
  let position = new Position(positionId.toString())
  position.positionId = positionId
  position.state = getPositionState(fetchedPosition.state)
  position.positionType = getPositionType(fetchedPosition.positionType)
  position.partyA = fetchedPosition.partyA
  position.leverageUsed = fetchedPosition.leverageUsed
  position.side = getSide(fetchedPosition.side)
  position.lockedMargin = convertAmountToDecimal(fetchedPosition.lockedMargin, SCALE)
  position.protocolFeePaid = convertAmountToDecimal(fetchedPosition.protocolFeePaid, SCALE)
  position.liquidationFee = convertAmountToDecimal(fetchedPosition.liquidationFee, SCALE)
  position.cva = convertAmountToDecimal(fetchedPosition.cva, SCALE)
  position.currentBalanceUnits = convertAmountToDecimal(fetchedPosition.currentBalanceUnits, SCALE)
  position.initialNotionalUsd = convertAmountToDecimal(fetchedPosition.initialNotionalUsd, SCALE)
  position.creationTimestamp = fetchedPosition.creationTimestamp
  position.mutableTimestamp = fetchedPosition.mutableTimestamp

  // Setup relationships
  position.market = fetchedPosition.marketId.toHexString()
  position.partyB = fetchedPosition.partyB.toHexString()

  // Save the Position
  position.save()

  // Create the fill
  createFill(positionId, fetchedPosition.marketId, position.partyA, event)

  // Remove open RFQ's
  let userA = getUser(fetchedPosition.partyA)
  let userB = getUser(fetchedPosition.partyB)

  userA.openRequestForQuotes = removeFromArray(userA.openRequestForQuotes, rfqId.toString())
  userB.openRequestForQuotes = removeFromArray(userB.openRequestForQuotes, rfqId.toString())

  // Add open positions
  if (position.positionType == 'ISOLATED') {
    userA.openPositionsIsolated.push(position.id)
    userB.openPositionsIsolated.push(position.id)
  } else {
    userA.openPositionsCross.push(position.id)
    userB.openPositionsCross.push(position.id)
  }

  userA.save()
  userB.save()
}

function fetchPosition(positionId: BigInt): MasterAgreement__getPositionResultPositionStruct {
  const contract = MasterAgreement.bind(MASTER_AGREEMENT_ADDRESS)
  return contract.getPosition(positionId)
}

function removeFromArray(arr: string[], item: string): string[] {
  let result: string[] = []
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] !== item) {
      result.push(arr[i])
    }
  }
  return result
}
