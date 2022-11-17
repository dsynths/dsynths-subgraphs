import {
  AcceptCancelOpenMarketSingle,
  CancelOpenMarketSingle,
  CreateMarket,
  Enlist,
  Fill,
  FillOpenMarketSingle,
  ForceCancelOpenMarketSingle,
  RejectOpenMarketSingle,
  RequestOpenMarketSingle
} from '../generated/MasterAgreement/MasterAgreement'
import {createFill} from './entities/fills'
import {enlist} from './entities/hedgers'
import {createMarket} from './entities/markets'
import {addActivePosition, addActiveRequestForQuote} from './entities/masteragreement'
import {removeUserOpenRequestForQuote} from './entities/party'
import {onOpenPosition} from './entities/positions'
import {onRequestForQuote, updateRequestForQuoteState} from './entities/requestForQuotes'
import {updateDailySnapshot, updateHourlySnapshot} from './entities/snapshots'
import {getSide} from './helpers'

export function handleCreateMarket(event: CreateMarket): void {
  createMarket(event.params.marketId)
}

export function handleEnlist(event: Enlist): void {
  enlist(event.params.hedger)
}

export function handleFill(event: Fill): void {
  createFill(event.params.positionId, getSide(event.params.side), event.params.amount, event.params.price, event)
}

export function handleRequestOpenMarketSingle(event: RequestOpenMarketSingle): void {
  // Create the RFQ
  const rfq = onRequestForQuote(event.params.partyA, event.params.rfqId)

  // Update global MasterAgreement
  const ma = addActiveRequestForQuote(rfq)

  // Update hourly & daily snapshots
  updateHourlySnapshot(ma, event)
  updateDailySnapshot(ma, event)
}

export function handleCancelOpenMarketSingle(event: CancelOpenMarketSingle): void {
  updateRequestForQuoteState(event.params.rfqId)
}

export function handleForceCancelOpenMarketSingle(event: ForceCancelOpenMarketSingle): void {
  const rfq = updateRequestForQuoteState(event.params.rfqId)
  if (!rfq) return
  removeUserOpenRequestForQuote(rfq.partyA, rfq.partyB, rfq)
}

export function handleAcceptCancelOpenMarketSingle(event: AcceptCancelOpenMarketSingle): void {
  const rfq = updateRequestForQuoteState(event.params.rfqId)
  if (!rfq) return
  removeUserOpenRequestForQuote(rfq.partyA, rfq.partyB, rfq)
}

export function handleRejectOpenMarketSingle(event: RejectOpenMarketSingle): void {
  const rfq = updateRequestForQuoteState(event.params.rfqId)
  if (!rfq) return
  removeUserOpenRequestForQuote(rfq.partyA, rfq.partyB, rfq)
}

export function handleFillOpenMarketSingle(event: FillOpenMarketSingle): void {
  // Create the position
  const position = onOpenPosition(event.params.rfqId, event.params.positionId)

  // Update global MasterAgreement
  const ma = addActivePosition(position)

  // Update hourly & daily snapshots
  updateHourlySnapshot(ma, event)
  updateDailySnapshot(ma, event)
}
