import {
  CreateMarket,
  Enlist,
  FillOpenMarketSingle,
  RequestOpenMarketSingle
} from '../generated/MasterAgreement/MasterAgreement'
import {createMarket, enlist, onRequestForQuote, onOpenPosition} from './entities'

export function handleCreateMarket(event: CreateMarket): void {
  createMarket(event.params.marketId)
}

export function handleEnlist(event: Enlist): void {
  enlist(event.params.hedger)
}

export function handleRequestOpenMarketSingle(event: RequestOpenMarketSingle): void {
  onRequestForQuote(event.params.partyA, event.params.rfqId)
}

export function handleFillOpenMarketSingle(event: FillOpenMarketSingle): void {
  onOpenPosition(event.params.rfqId, event.params.positionId, event)
}
