import {Address, BigInt} from '@graphprotocol/graph-ts'
import {SCALE} from 'const'

import {
  MasterAgreement,
  MasterAgreement__getRequestForQuoteResultRfqStruct
} from '../../generated/MasterAgreement/MasterAgreement'
import {RequestForQuote} from '../../generated/schema'
import {getUser} from './user'

import {MASTER_AGREEMENT_ADDRESS} from '../../constants'
import {
  convertAmountToDecimal,
  getHedgerMode,
  getOrderType,
  getPositionType,
  getRequestForQuoteState,
  getSide
} from '../helpers'

export function onRequestForQuote(partyA: Address, rfqId: BigInt): void {
  const fetchedRequestForQuote = fetchRequestForQuote(rfqId)

  // Create the RFQ
  let rfq = new RequestForQuote(rfqId.toString())
  rfq.rfqId = rfqId
  rfq.state = getRequestForQuoteState(fetchedRequestForQuote.state)
  rfq.positionType = getPositionType(fetchedRequestForQuote.positionType)
  rfq.orderType = getOrderType(fetchedRequestForQuote.orderType)
  rfq.partyA = partyA
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
  rfq.partyB = fetchedRequestForQuote.partyB.toHexString()

  // Save the RFQ
  rfq.save()

  // Add RFQ to user lists
  let userA = getUser(partyA)
  let userB = getUser(fetchedRequestForQuote.partyB)
  userA.openRequestForQuotes.push(rfq.id)
  userB.openRequestForQuotes.push(rfq.id)
  userA.save()
  userB.save()
}

function fetchRequestForQuote(rfqId: BigInt): MasterAgreement__getRequestForQuoteResultRfqStruct {
  const contract = MasterAgreement.bind(MASTER_AGREEMENT_ADDRESS)
  return contract.getRequestForQuote(rfqId)
}
