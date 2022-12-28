import {Bytes} from '@graphprotocol/graph-ts'
import {Party, Position, RequestForQuote} from '../../generated/schema'
import {removeFromArray} from '../helpers'

export function getParty(account: Bytes): Party {
  let party = Party.load(account.toHexString())
  if (!party) {
    party = new Party(account.toHexString())
    party.openRequestForQuotesIsolated = []
    party.openRequestForQuotesCross = []
    party.openPositionsIsolated = []
    party.openPositionsCross = []
    party.save()
  }
  return party
}

export function addRequestForQuote(account: Bytes, rfq: RequestForQuote): void {
  let party = getParty(account)

  if (rfq.positionType == 'ISOLATED') {
    const list = party.openRequestForQuotesIsolated
    list.push(rfq.id)
    party.openRequestForQuotesIsolated = list
    party.save()
  } else {
    const list = party.openRequestForQuotesCross
    list.push(rfq.id)
    party.openRequestForQuotesCross = list
    party.save()
  }
}

export function removeRequestForQuote(account: Bytes, rfq: RequestForQuote): void {
  let party = getParty(account)

  if (rfq.positionType == 'ISOLATED') {
    const list = removeFromArray(party.openRequestForQuotesIsolated, rfq.id)
    party.openRequestForQuotesIsolated = list
    party.save()
  } else {
    const list = removeFromArray(party.openRequestForQuotesCross, rfq.id)
    party.openRequestForQuotesCross = list
    party.save()
  }
}

export function addPosition(account: Bytes, position: Position, positionType: string): void {
  let party = getParty(account)

  if (positionType == 'ISOLATED') {
    const list = party.openPositionsIsolated
    list.push(position.id)
    party.openPositionsIsolated = list
    party.save()
  } else {
    const list = party.openPositionsCross
    list.push(position.id)
    party.openPositionsCross = list
    party.save()
  }
}

export function removePosition(account: Bytes, position: Position, positionType: string): void {
  let party = getParty(account)

  if (positionType == 'ISOLATED') {
    const list = removeFromArray(party.openPositionsIsolated, position.id)
    party.openPositionsIsolated = list
    party.save()
  } else {
    const list = removeFromArray(party.openPositionsCross, position.id)
    party.openPositionsCross = list
    party.save()
  }
}
