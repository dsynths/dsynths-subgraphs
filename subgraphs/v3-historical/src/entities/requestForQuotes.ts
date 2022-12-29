import {BigInt, ethereum} from '@graphprotocol/graph-ts'
import {
  MasterAgreement,
  MasterAgreement__getRequestForQuoteResultRfqStruct
} from '../../generated/MasterAgreement/MasterAgreement'
import {RequestForQuote, RequestForQuoteSnapshot} from '../../generated/schema'
import {MASTER_AGREEMENT_ADDRESS} from '../../constants'

function generateSnapshotID(rfqId: BigInt, event: ethereum.Event): string {
  return `${rfqId.toHexString()}-${event.transaction.hash.toHexString()}-${event.transactionLogIndex.toHexString()}`
}

function getRequestForQuote(rfqId: BigInt): RequestForQuote | null {
  return RequestForQuote.load(rfqId.toHexString())
}

export function createRequestForQuoteGenesis(rfqId: BigInt, snapshotIdGenesis: string): RequestForQuote {
  let rfq = new RequestForQuote(rfqId.toHexString())
  rfq.lastSnapshotId = snapshotIdGenesis
  rfq.save()
  return rfq
}

export function updateRequestForQuoteLastSnapshot(rfqId: BigInt, snapshotId: string): void {
  let rfq = getRequestForQuote(rfqId)
  if (!rfq) return
  rfq.lastSnapshotId = snapshotId
  rfq.save()
}

export function getLastRequestForQuoteSnapshot(rfqId: BigInt): RequestForQuoteSnapshot | null {
  const rfq = getRequestForQuote(rfqId)
  if (!rfq) return null
  return RequestForQuoteSnapshot.load(rfq.lastSnapshotId)
}

export function createRequestForQuoteSnapshot(rfqId: BigInt, event: ethereum.Event): RequestForQuoteSnapshot {
  let rfq = new RequestForQuoteSnapshot(generateSnapshotID(rfqId, event))
  const fetchedRequestForQuote = fetchRequestForQuote(rfqId)

  rfq.timestamp = event.block.timestamp
  rfq.rfqId = rfqId
  rfq.marketId = fetchedRequestForQuote.marketId
  rfq.oldState = 'NEW'
  rfq.newState = 'NEW'
  rfq.partyA = fetchedRequestForQuote.partyA

  rfq.save()
  return rfq
}

export function createRequestForQuoteSnapshotCanceled(
  lastSnapshot: RequestForQuoteSnapshot,
  event: ethereum.Event
): RequestForQuoteSnapshot {
  let rfq = createRequestForQuoteSnapshot(lastSnapshot.rfqId, event)
  // Override fields
  rfq.oldState = lastSnapshot.newState
  rfq.newState = 'CANCELED'

  rfq.save()
  return rfq
}

export function createRequestForQuoteSnapshotAccepted(
  lastSnapshot: RequestForQuoteSnapshot,
  event: ethereum.Event
): RequestForQuoteSnapshot {
  let rfq = createRequestForQuoteSnapshot(lastSnapshot.rfqId, event)
  // Override fields
  rfq.oldState = lastSnapshot.newState
  rfq.newState = 'ACCEPTED'

  rfq.save()
  return rfq
}

function fetchRequestForQuote(rfqId: BigInt): MasterAgreement__getRequestForQuoteResultRfqStruct {
  const contract = MasterAgreement.bind(MASTER_AGREEMENT_ADDRESS)
  return contract.getRequestForQuote(rfqId)
}
