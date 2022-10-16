import {BigInt, Bytes, ethereum, log} from '@graphprotocol/graph-ts'
import {SCALE} from 'const'

import {
  MasterAgreement,
  MasterAgreement__getPositionFillsResultFillsStruct
} from '../../generated/MasterAgreement/MasterAgreement'
import {Fill} from '../../generated/schema'

import {MASTER_AGREEMENT_ADDRESS} from '../../constants'
import {convertAmountToDecimal, getSide} from '../helpers'

export function createFill(positionId: BigInt, marketId: BigInt, user: Bytes, event: ethereum.Event): void {
  const fetchedFills = fetchFills(positionId)

  for (let i = 0; i < fetchedFills.length; i++) {
    const id = `${positionId}:${fetchedFills[i].fillId.toString()}`
    let fill = Fill.load(id)

    if (!fill) {
      fill = new Fill(id)
      fill.fillId = fetchedFills[i].fillId
      fill.marketId = marketId
      fill.position = positionId.toString()
      fill.user = user.toHexString()
      fill.side = getSide(fetchedFills[i].side)
      fill.amount = convertAmountToDecimal(fetchedFills[i].filledAmountUnits, SCALE)
      fill.price = convertAmountToDecimal(fetchedFills[i].avgPriceUsd, SCALE)
      fill.transactionHash = event.transaction.hash.toHexString()
      fill.timestamp = fetchedFills[i].timestamp
      fill.save()
    }
  }
}

function fetchFills(positionId: BigInt): MasterAgreement__getPositionFillsResultFillsStruct[] {
  const contract = MasterAgreement.bind(MASTER_AGREEMENT_ADDRESS)
  return contract.getPositionFills(positionId)
}
