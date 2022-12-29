import {SCALE} from 'const'
import {
  CancelClosePosition,
  ClosePosition,
  Liquidate,
  OpenPosition,
  RequestClosePosition,
  RequestForQuoteCanceled,
  RequestForQuoteNew
} from '../generated/MasterAgreement/MasterAgreement'
import {
  createPositionGenesis,
  createPositionSnapshot,
  createPositionSnapshotCancelClosePosition,
  createPositionSnapshotClosePosition,
  createPositionSnapshotLiquidate,
  createPositionSnapshotMarketCloseRequested,
  getLastPositionSnapshot,
  updatePositionLastSnapshot
} from './entities/positions'
import {
  createRequestForQuoteGenesis,
  createRequestForQuoteSnapshot,
  createRequestForQuoteSnapshotAccepted,
  createRequestForQuoteSnapshotCanceled,
  getLastRequestForQuoteSnapshot,
  updateRequestForQuoteLastSnapshot
} from './entities/requestForQuotes'
import {createTrade} from './entities/trades'
import {convertAmountToDecimal, getSide} from './helpers'

export function handleRequestForQuoteNew(event: RequestForQuoteNew): void {
  // Create RFQ Snapshot from Genesis
  const snapshot = createRequestForQuoteSnapshot(event.params.rfqId, event)

  // Create RequestForQuote Genesis & assign Snapshot to it
  createRequestForQuoteGenesis(snapshot.rfqId, snapshot.id)
}

export function handleRequestForQuoteCanceled(event: RequestForQuoteCanceled): void {
  // Get last snapshot
  const lastSnapshot = getLastRequestForQuoteSnapshot(event.params.rfqId)
  if (!lastSnapshot) return

  // Create a new snapshot
  const snapshot = createRequestForQuoteSnapshotCanceled(lastSnapshot, event)

  // Assign snapshot to RFQ
  updateRequestForQuoteLastSnapshot(snapshot.rfqId, snapshot.id)
}

export function handleOpenPosition(event: OpenPosition): void {
  // Create snapshot for RequestForQuote -> Accepted
  const lastSnapshot = getLastRequestForQuoteSnapshot(event.params.rfqId)
  if (!lastSnapshot) return
  createRequestForQuoteSnapshotAccepted(lastSnapshot, event)
  updateRequestForQuoteLastSnapshot(lastSnapshot.rfqId, lastSnapshot.id)

  // Create Position snapshot from Genesis
  const snapshot = createPositionSnapshot(
    event.params.positionId,
    convertAmountToDecimal(event.params.avgPriceUsd, SCALE),
    event
  )

  // Create genesis Position & assign snapshot to it
  createPositionGenesis(snapshot.positionId, snapshot.id)

  // Log the Trade details
  createTrade(event.params.positionId, event.params.amountUnits, event.params.avgPriceUsd, true, event)
}

export function handleRequestClosePosition(event: RequestClosePosition): void {
  // Get last snapshot
  const lastSnapshot = getLastPositionSnapshot(event.params.positionId)
  if (!lastSnapshot) return

  // Create a new snapshot
  const snapshot = createPositionSnapshotMarketCloseRequested(lastSnapshot, event)

  // Assign snapshot to Position
  updatePositionLastSnapshot(snapshot.positionId, snapshot.id)
}

export function handleCancelClosePosition(event: CancelClosePosition): void {
  // Get last snapshot
  const lastSnapshot = getLastPositionSnapshot(event.params.positionId)
  if (!lastSnapshot) return

  // Create a new snapshot
  const snapshot = createPositionSnapshotCancelClosePosition(lastSnapshot, event)

  // Assign snapshot to Position
  updatePositionLastSnapshot(snapshot.positionId, snapshot.id)
}

export function handleClosePosition(event: ClosePosition): void {
  // Get last snapshot
  const lastSnapshot = getLastPositionSnapshot(event.params.positionId)
  if (!lastSnapshot) return

  // Create a new snapshot
  const snapshot = createPositionSnapshotClosePosition(lastSnapshot, event.params.avgPriceUsd, event)

  // Assign snapshot to Position
  updatePositionLastSnapshot(snapshot.positionId, snapshot.id)

  // Log the Trade details
  createTrade(event.params.positionId, event.params.amountUnits, event.params.avgPriceUsd, false, event)
}

export function handleLiquidate(event: Liquidate): void {
  // Get last snapshot
  const lastSnapshot = getLastPositionSnapshot(event.params.positionId)
  if (!lastSnapshot) return

  // Create a new snapshot
  const snapshot = createPositionSnapshotLiquidate(lastSnapshot, event.params.priceUsd, event)

  // Assign snapshot to Position
  updatePositionLastSnapshot(snapshot.positionId, snapshot.id)

  // Log the Trade details
  createTrade(event.params.positionId, event.params.amountUnits, event.params.priceUsd, false, event)
}
