import {Address, BigInt} from '@graphprotocol/graph-ts'
import {RequestForQuote} from '../../generated/schema'

export function getRequestForQuote(rfqId: BigInt): RequestForQuote | null {
  return RequestForQuote.load(rfqId.toHexString())
}

export function createRequestForQuote(rfqId: BigInt, partyA: Address, partyB: Address): RequestForQuote {
  let requestForQuote = new RequestForQuote(rfqId.toHexString())
  requestForQuote.rfqId = rfqId
  requestForQuote.state = 'NEW'
  requestForQuote.partyA = partyA
  requestForQuote.partyB = partyB
  requestForQuote.save()
  return requestForQuote
}

export function updateRequestForQuoteState(rfqId: BigInt, state: string): RequestForQuote | null {
  let rfq = getRequestForQuote(rfqId)
  if (rfq) {
    rfq.state = state
    rfq.save()
  }
  return rfq
}
