import {Address, BigInt} from '@graphprotocol/graph-ts'
import {SCALE} from 'const'

import {
  MasterAgreement,
  MasterAgreement__getRequestForQuoteResultRfqStruct
} from '../../generated/MasterAgreement/MasterAgreement'
import {RequestForQuote} from '../../generated/schema'

import {MASTER_AGREEMENT_ADDRESS} from '../../constants'
import {
  convertAmountToDecimal,
  getHedgerMode,
  getOrderType,
  getPositionType,
  getRequestForQuoteState,
  getSide
} from '../helpers'
import {addUserOpenRequestForQuote} from './user'

export function getRequestForQuote(rfqId: BigInt): RequestForQuote | null {
  return RequestForQuote.load(rfqId.toString())
}

export function onRequestForQuote(partyA: Address, rfqId: BigInt): RequestForQuote {
  const fetchedRequestForQuote = fetchRequestForQuote(rfqId)

  // Create the RFQ
  let rfq = new RequestForQuote(rfqId.toString())
  rfq.rfqId = rfqId
  rfq.state = getRequestForQuoteState(fetchedRequestForQuote.state)
  rfq.positionType = getPositionType(fetchedRequestForQuote.positionType)
  rfq.orderType = getOrderType(fetchedRequestForQuote.orderType)
  rfq.partyA = partyA
  rfq.partyB = fetchedRequestForQuote.partyB
  rfq.hedgerMode = getHedgerMode(fetchedRequestForQuote.hedgerMode)
  rfq.side = getSide(fetchedRequestForQuote.side)
  rfq.notionalUsd = convertAmountToDecimal(fetchedRequestForQuote.notionalUsd, SCALE)
  rfq.leverageUsed = fetchedRequestForQuote.leverageUsed
  rfq.lockedMargin = convertAmountToDecimal(fetchedRequestForQuote.lockedMargin, SCALE)
  rfq.protocolFee = convertAmountToDecimal(fetchedRequestForQuote.protocolFee, SCALE)
  rfq.liquidationFee = convertAmountToDecimal(fetchedRequestForQuote.liquidationFee, SCALE)
  rfq.cva = convertAmountToDecimal(fetchedRequestForQuote.cva, SCALE)
  rfq.minExpectedUnits = convertAmountToDecimal(fetchedRequestForQuote.minExpectedUnits, SCALE)
  rfq.maxExpectedUnits = convertAmountToDecimal(fetchedRequestForQuote.maxExpectedUnits, SCALE)
  rfq.creationTimestamp = fetchedRequestForQuote.creationTimestamp
  rfq.mutableTimestamp = fetchedRequestForQuote.mutableTimestamp

  // Setup relationships
  rfq.market = fetchedRequestForQuote.marketId.toString()

  // Save the RFQ
  rfq.save()

  // Update User state
  addUserOpenRequestForQuote(rfq.partyA, rfq.partyB, rfq)

  return rfq
}

function fetchRequestForQuote(rfqId: BigInt): MasterAgreement__getRequestForQuoteResultRfqStruct {
  const contract = MasterAgreement.bind(MASTER_AGREEMENT_ADDRESS)
  return contract.getRequestForQuote(rfqId)
}
