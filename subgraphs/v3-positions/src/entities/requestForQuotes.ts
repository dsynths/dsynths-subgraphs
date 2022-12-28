import {Address, BigInt, ethereum} from '@graphprotocol/graph-ts'
import {
  MasterAgreement,
  MasterAgreement__getRequestForQuoteResultRfqStruct
} from '../../generated/MasterAgreement/MasterAgreement'
import {RequestForQuote} from '../../generated/schema'
import {MASTER_AGREEMENT_ADDRESS} from '../../constants'
import {getHedgerMode, getOrderType, getPositionType} from '../helpers'

export function getRequestForQuote(rfqId: BigInt): RequestForQuote | null {
  return RequestForQuote.load(rfqId.toHexString())
}

export function createRequestForQuote(rfqId: BigInt, partyA: Address, partyB: Address): RequestForQuote {
  const fetchedRequestForQuote = fetchRequestForQuote(rfqId)

  let requestForQuote = new RequestForQuote(rfqId.toHexString())
  requestForQuote.creationTimestamp = fetchedRequestForQuote.creationTimestamp
  requestForQuote.mutableTimestamp = fetchedRequestForQuote.mutableTimestamp
  requestForQuote.rfqId = rfqId
  requestForQuote.state = 'NEW'
  requestForQuote.partyA = partyA
  requestForQuote.partyB = partyB
  requestForQuote.positionType = getPositionType(fetchedRequestForQuote.positionType)
  requestForQuote.orderType = getOrderType(fetchedRequestForQuote.orderType)
  requestForQuote.hedgerMode = getHedgerMode(fetchedRequestForQuote.hedgerMode)
  requestForQuote.save()

  return requestForQuote
}

export function updateRequestForQuoteState(
  rfqId: BigInt,
  state: string,
  event: ethereum.Event
): RequestForQuote | null {
  let rfq = getRequestForQuote(rfqId)
  if (rfq) {
    rfq.state = state
    rfq.mutableTimestamp = event.block.timestamp
    rfq.save()
  }
  return rfq
}

function fetchRequestForQuote(rfqId: BigInt): MasterAgreement__getRequestForQuoteResultRfqStruct {
  const contract = MasterAgreement.bind(MASTER_AGREEMENT_ADDRESS)
  return contract.getRequestForQuote(rfqId)
}
