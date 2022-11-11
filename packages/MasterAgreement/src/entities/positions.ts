import {BigInt, ethereum, log} from '@graphprotocol/graph-ts'
import {SCALE} from 'const'

import {
  MasterAgreement,
  MasterAgreement__getPositionResultPositionStruct
} from '../../generated/MasterAgreement/MasterAgreement'
import {Position} from '../../generated/schema'
import {addUserPosition, removeUserOpenRequestForQuote} from './user'

import {MASTER_AGREEMENT_ADDRESS} from '../../constants'
import {convertAmountToDecimal, getPositionState, getPositionType, getSide} from '../helpers'
import {createFill} from './fill'
import {getRequestForQuote} from './requestForQuotes'

export function onOpenPosition(rfqId: BigInt, positionId: BigInt, event: ethereum.Event): Position {
  const fetchedPosition = fetchPosition(positionId)

  // Create the position
  let position = new Position(positionId.toString())
  position.positionId = positionId
  position.state = getPositionState(fetchedPosition.state)
  position.positionType = getPositionType(fetchedPosition.positionType)
  position.partyA = fetchedPosition.partyA
  position.partyB = fetchedPosition.partyB
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
  position.market = fetchedPosition.marketId.toString()

  // Save the Position
  position.save()

  // Create the fill
  createFill(positionId, fetchedPosition.marketId, position.partyA, event)

  // Update the RFQ status
  const rfq = getRequestForQuote(rfqId)
  if (!rfq) return position // this is impossible to happen but it satisfies the compiler
  rfq.state = 'ACCEPTED'
  rfq.save()

  // Update User state
  removeUserOpenRequestForQuote(rfq.partyA, rfq.partyB, rfq)
  addUserPosition(position.partyA, position.partyB, position)

  return position
}

function fetchPosition(positionId: BigInt): MasterAgreement__getPositionResultPositionStruct {
  const contract = MasterAgreement.bind(MASTER_AGREEMENT_ADDRESS)
  return contract.getPosition(positionId)
}
