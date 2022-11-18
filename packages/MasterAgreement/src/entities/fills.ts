import {BigInt, ethereum} from '@graphprotocol/graph-ts'
import {SCALE} from 'const'

import {Fill} from '../../generated/schema'
import {fetchPosition} from '../fetchers'
import {convertAmountToDecimal} from '../helpers'

export function createFill(
  positionId: BigInt,
  side: string,
  amount: BigInt,
  price: BigInt,
  event: ethereum.Event
): void {
  const id = `${event.transaction.hash.toHex()}-${event.logIndex.toString()}`
  const fetchedPosition = fetchPosition(positionId)

  let fill = new Fill(id)
  fill = new Fill(id)
  fill.marketId = fetchedPosition.marketId
  fill.positionId = positionId
  fill.party = fetchedPosition.partyA
  fill.side = side
  fill.amount = convertAmountToDecimal(amount, SCALE)
  fill.price = convertAmountToDecimal(price, SCALE)
  fill.transactionHash = event.transaction.hash.toHexString()
  fill.timestamp = event.block.timestamp
  fill.save()
}
