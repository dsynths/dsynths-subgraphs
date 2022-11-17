import {BigInt} from '@graphprotocol/graph-ts'
import {SCALE} from 'const'

import {Position} from '../../generated/schema'
import {addUserPosition, removeUserOpenRequestForQuote} from './party'
import {calculateLeverageUsed, convertAmountToDecimal, getPositionState, getPositionType, getSide} from '../helpers'
import {getRequestForQuote} from './requestForQuotes'
import {fetchPosition} from '../fetchers'

export function onOpenPosition(rfqId: BigInt, positionId: BigInt): Position {
  const fetchedPosition = fetchPosition(positionId)

  // Create the position
  let position = new Position(positionId.toString())
  position.creationTimestamp = fetchedPosition.creationTimestamp
  position.mutableTimestamp = fetchedPosition.mutableTimestamp
  position.positionId = positionId
  position.uuid = fetchedPosition.uuid
  position.state = getPositionState(fetchedPosition.state)
  position.positionType = getPositionType(fetchedPosition.positionType)
  position.partyA = fetchedPosition.partyA
  position.partyB = fetchedPosition.partyB
  position.side = getSide(fetchedPosition.side)
  position.lockedMarginA = convertAmountToDecimal(fetchedPosition.lockedMarginA, SCALE)
  position.lockedMarginB = convertAmountToDecimal(fetchedPosition.lockedMarginB, SCALE)
  position.protocolFeePaid = convertAmountToDecimal(fetchedPosition.protocolFeePaid, SCALE)
  position.liquidationFee = convertAmountToDecimal(fetchedPosition.liquidationFee, SCALE)
  position.cva = convertAmountToDecimal(fetchedPosition.cva, SCALE)
  position.currentBalanceUnits = convertAmountToDecimal(fetchedPosition.currentBalanceUnits, SCALE)
  position.initialNotionalUsd = convertAmountToDecimal(fetchedPosition.initialNotionalUsd, SCALE)
  position.affiliate = fetchedPosition.affiliate
  position.leverageUsed = calculateLeverageUsed(
    convertAmountToDecimal(fetchedPosition.initialNotionalUsd, SCALE),
    convertAmountToDecimal(fetchedPosition.lockedMarginA, SCALE)
  )

  // Setup relationships
  position.market = fetchedPosition.marketId.toString()

  // Save the Position
  position.save()

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
