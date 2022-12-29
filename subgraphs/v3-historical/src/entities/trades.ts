import {BigInt, ethereum} from '@graphprotocol/graph-ts'
import {SCALE} from 'const'
import {Trade} from '../../generated/schema'
import {convertAmountToDecimal, getSide} from '../helpers'
import {fetchPosition} from './positions'

export function generateTradeID(positionId: BigInt, event: ethereum.Event): string {
  return `${positionId.toHexString()}-${event.transaction.hash.toHexString()}-${event.transactionLogIndex.toHexString()}`
}

export function createTrade(
  positionId: BigInt,
  amount: BigInt,
  price: BigInt,
  isOpen: boolean,
  event: ethereum.Event
): void {
  const fetchedPosition = fetchPosition(positionId)

  let side = getSide(fetchedPosition.side)
  if (!isOpen) {
    side = side == 'BUY' ? 'SELL' : 'BUY'
  }

  let trade = new Trade(generateTradeID(positionId, event))
  trade.timestamp = event.block.timestamp
  trade.positionId = positionId
  trade.marketId = fetchedPosition.marketId
  trade.party = fetchedPosition.partyA
  trade.side = side
  trade.amount = convertAmountToDecimal(amount, SCALE)
  trade.price = convertAmountToDecimal(price, SCALE)
  trade.transactionHash = event.transaction.hash.toHexString()
  trade.save()
}
