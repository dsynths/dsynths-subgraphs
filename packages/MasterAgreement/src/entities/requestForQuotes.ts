import {Address, BigInt} from '@graphprotocol/graph-ts'
import {SCALE} from 'const'

import {RequestForQuote} from '../../generated/schema'

import {
  calculateLeverageUsed,
  convertAmountToDecimal,
  getHedgerMode,
  getOrderType,
  getPositionType,
  getRequestForQuoteState,
  getSide
} from '../helpers'
import {addUserOpenRequestForQuote} from './party'
import {fetchRequestForQuote} from '../fetchers'

export function getRequestForQuote(rfqId: BigInt): RequestForQuote | null {
  return RequestForQuote.load(rfqId.toString())
}

export function onRequestForQuote(partyA: Address, rfqId: BigInt): RequestForQuote {
  const fetchedRequestForQuote = fetchRequestForQuote(rfqId)

  // Create the RFQ
  let rfq = new RequestForQuote(rfqId.toString())
  rfq.creationTimestamp = fetchedRequestForQuote.creationTimestamp
  rfq.mutableTimestamp = fetchedRequestForQuote.mutableTimestamp
  rfq.rfqId = rfqId
  rfq.state = getRequestForQuoteState(fetchedRequestForQuote.state)
  rfq.positionType = getPositionType(fetchedRequestForQuote.positionType)
  rfq.orderType = getOrderType(fetchedRequestForQuote.orderType)
  rfq.partyA = partyA
  rfq.partyB = fetchedRequestForQuote.partyB
  rfq.hedgerMode = getHedgerMode(fetchedRequestForQuote.hedgerMode)
  rfq.side = getSide(fetchedRequestForQuote.side)
  rfq.notionalUsd = convertAmountToDecimal(fetchedRequestForQuote.notionalUsd, SCALE)
  rfq.lockedMarginA = convertAmountToDecimal(fetchedRequestForQuote.lockedMarginA, SCALE)
  rfq.protocolFee = convertAmountToDecimal(fetchedRequestForQuote.protocolFee, SCALE)
  rfq.liquidationFee = convertAmountToDecimal(fetchedRequestForQuote.liquidationFee, SCALE)
  rfq.cva = convertAmountToDecimal(fetchedRequestForQuote.cva, SCALE)
  rfq.minExpectedUnits = convertAmountToDecimal(fetchedRequestForQuote.minExpectedUnits, SCALE)
  rfq.maxExpectedUnits = convertAmountToDecimal(fetchedRequestForQuote.maxExpectedUnits, SCALE)
  rfq.affiliate = fetchedRequestForQuote.affiliate
  rfq.leverageUsed = calculateLeverageUsed(
    convertAmountToDecimal(fetchedRequestForQuote.notionalUsd, SCALE),
    convertAmountToDecimal(fetchedRequestForQuote.lockedMarginA, SCALE)
  )

  // Setup relationships
  rfq.market = fetchedRequestForQuote.marketId.toString()

  // Save the RFQ
  rfq.save()

  // Update User state
  addUserOpenRequestForQuote(rfq.partyA, rfq.partyB, rfq)

  return rfq
}

export function updateRequestForQuoteState(rfqId: BigInt): RequestForQuote | null {
  const rfq = getRequestForQuote(rfqId)
  if (!rfq) return null

  const fetchedRequestForQuote = fetchRequestForQuote(rfqId)
  rfq.state = getRequestForQuoteState(fetchedRequestForQuote.state)
  rfq.mutableTimestamp = fetchedRequestForQuote.mutableTimestamp
  rfq.save()

  return rfq
}
