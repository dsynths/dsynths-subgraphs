import {Bytes} from '@graphprotocol/graph-ts'
import {Party, Position, RequestForQuote} from '../../generated/schema'
import {removeFromArray} from '../helpers'

export function getParty(account: Bytes): Party {
  let party = Party.load(account.toHexString())
  if (!party) {
    party = new Party(account.toHexString())
    party.openRequestForQuotes = []
    party.openPositions = []
    party.save()
  }
  return party
}

export function addRequestForQuote(account: Bytes, rfq: RequestForQuote): void {
  let party = getParty(account)

  const list = party.openRequestForQuotes
  list.push(rfq.id)
  party.openRequestForQuotes = list
  party.save()
}

export function removeRequestForQuote(account: Bytes, rfq: RequestForQuote): void {
  let party = getParty(account)

  const list = removeFromArray(party.openRequestForQuotes, rfq.id)
  party.openRequestForQuotes = list
  party.save()
}

export function addPosition(account: Bytes, position: Position): void {
  let party = getParty(account)

  const list = party.openPositions
  list.push(position.id)
  party.openPositions = list
  party.save()
}

export function removePosition(account: Bytes, position: Position): void {
  let party = getParty(account)

  const list = removeFromArray(party.openPositions, position.id)
  party.openPositions = list
  party.save()
}
