import {
  CreateMarket,
  Enlist,
  FillOpenMarketSingle,
  RequestOpenMarketSingle
} from '../generated/MasterAgreement/MasterAgreement'
import {createMarket, enlist, onRequestForQuote, onOpenPosition} from './entities'
import {addActivePosition, addActiveRequestForQuote} from './entities/masteragreement'
import {updateDailySnapshot, updateHourlySnapshot} from './entities/snapshot'

export function handleCreateMarket(event: CreateMarket): void {
  createMarket(event.params.marketId)
}

export function handleEnlist(event: Enlist): void {
  enlist(event.params.hedger)
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

export function handleFillOpenMarketSingle(event: FillOpenMarketSingle): void {
  // Create the position
  const position = onOpenPosition(event.params.rfqId, event.params.positionId, event)

  // Update global MasterAgreement
  const ma = addActivePosition(position)

  // Update hourly & daily snapshots
  updateHourlySnapshot(ma, event)
  updateDailySnapshot(ma, event)
}
