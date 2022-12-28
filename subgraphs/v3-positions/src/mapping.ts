import {
  CancelClosePosition,
  ClosePosition,
  Liquidate,
  OpenPosition,
  RequestClosePosition,
  RequestForQuoteCanceled,
  RequestForQuoteNew
} from '../generated/MasterAgreement/MasterAgreement'
import {addPosition, addRequestForQuote, removePosition, removeRequestForQuote} from './entities/party'
import {createPosition, updatePositionBalance, updatePositionExitPrice, updatePositionState} from './entities/positions'
import {createRequestForQuote, updateRequestForQuoteState} from './entities/requestForQuotes'

export function handleRequestForQuoteNew(event: RequestForQuoteNew): void {
  // Create RFQ
  const rfq = createRequestForQuote(event.params.rfqId, event.params.partyA, event.params.partyB)

  // Append RFQ to parties
  addRequestForQuote(event.params.partyA, rfq)
  addRequestForQuote(event.params.partyB, rfq)
}

export function handleRequestForQuoteCanceled(event: RequestForQuoteCanceled): void {
  // Update RFQ state
  const rfq = updateRequestForQuoteState(event.params.rfqId, 'CANCELED')
  if (!rfq) return

  // Remove RFQ from parties
  removeRequestForQuote(rfq.partyA, rfq)
  removeRequestForQuote(rfq.partyB, rfq)
}

export function handleOpenPosition(event: OpenPosition): void {
  // Create Position
  const position = createPosition(
    event.params.rfqId,
    event.params.positionId,
    event.params.partyA,
    event.params.partyB,
    event.params.amountUnits,
    event.params.avgPriceUsd
  )

  // Update RFQ state
  const rfq = updateRequestForQuoteState(event.params.rfqId, 'ACCEPTED')
  if (!rfq) return

  // Remove RFQ from parties
  removeRequestForQuote(rfq.partyA, rfq)
  removeRequestForQuote(rfq.partyB, rfq)

  // Append Position to parties
  addPosition(event.params.partyA, position)
  addPosition(event.params.partyB, position)
}

export function handleRequestClosePosition(event: RequestClosePosition): void {
  // Update Position state
  updatePositionState(event.params.positionId, 'MARKET_CLOSE_REQUESTED')
}

export function handleCancelClosePosition(event: CancelClosePosition): void {
  // Update Position state
  updatePositionState(event.params.positionId, 'OPEN')
}

export function handleClosePosition(event: ClosePosition): void {
  // Update Position state
  const position = updatePositionState(event.params.positionId, 'CLOSED')
  if (!position) return

  // Update Position units and price
  updatePositionBalance(event.params.positionId, event.params.amountUnits)
  updatePositionExitPrice(event.params.positionId, event.params.avgPriceUsd)

  // Remove Position from parties
  removePosition(position.partyA, position)
  removePosition(position.partyB, position)
}

export function handleLiquidate(event: Liquidate): void {
  // Update Position state
  const position = updatePositionState(event.params.positionId, 'LIQUIDATED')
  if (!position) return

  // Update Position units and price
  updatePositionBalance(event.params.positionId, event.params.amountUnits)
  updatePositionExitPrice(event.params.positionId, event.params.priceUsd)

  // Remove Position from parties
  removePosition(position.partyA, position)
  removePosition(position.partyB, position)
}
