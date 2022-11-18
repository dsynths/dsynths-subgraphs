import {Bytes} from '@graphprotocol/graph-ts'
import {Party, Position, RequestForQuote} from '../../generated/schema'
import {removeFromArray} from '../helpers'

export function getParty(account: Bytes): Party {
  let party = Party.load(account.toHexString())
  if (!party) {
    party = new Party(account.toHexString())
    party.openRequestForQuotes = []
    party.openPositionsIsolated = []
    party.openPositionsCross = []
    party.save()
  }
  return party
}

export function addPartyOpenRequestForQuote(partyA: Bytes, partyB: Bytes, rfq: RequestForQuote): void {
  let userA = getParty(partyA)
  let userB = getParty(partyB)

  // Copy the list so we can append to it
  const rfqListA = userA.openRequestForQuotes
  const rfqListB = userB.openRequestForQuotes
  rfqListA.push(rfq.id)
  rfqListB.push(rfq.id)

  // Reassign the list
  userA.openRequestForQuotes = rfqListA
  userB.openRequestForQuotes = rfqListB

  userA.save()
  userB.save()
}

export function removePartyOpenRequestForQuote(partyA: Bytes, partyB: Bytes, rfq: RequestForQuote): void {
  let userA = getParty(partyA)
  let userB = getParty(partyB)

  // Copy the list so we can remove from it
  const rfqListA = removeFromArray(userA.openRequestForQuotes, rfq.id)
  const rfqListB = removeFromArray(userB.openRequestForQuotes, rfq.id)

  // Reassign the list
  userA.openRequestForQuotes = rfqListA
  userB.openRequestForQuotes = rfqListB

  userA.save()
  userB.save()
}

export function addPartyPosition(partyA: Bytes, partyB: Bytes, position: Position): void {
  let userA = getParty(partyA)
  let userB = getParty(partyB)

  // Copy the lists so we can append to it
  const openPositionsIsolatedA = userA.openPositionsIsolated
  const openPositionsIsolatedB = userB.openPositionsIsolated
  const openPositionsCrossA = userA.openPositionsCross // B is isolated by default

  if (position.positionType == 'ISOLATED') {
    openPositionsIsolatedA.push(position.id)
    openPositionsIsolatedB.push(position.id)
  } else {
    openPositionsCrossA.push(position.id)
    openPositionsIsolatedB.push(position.id)
  }

  // Reassign the list
  userA.openPositionsIsolated = openPositionsIsolatedA
  userB.openPositionsIsolated = openPositionsIsolatedB
  userA.openPositionsCross = openPositionsCrossA

  userA.save()
  userB.save()
}

export function removePartyPosition(partyA: Bytes, partyB: Bytes, position: Position): void {
  let userA = getParty(partyA)
  let userB = getParty(partyB)

  let openPositionsIsolatedA = userA.openPositionsIsolated
  let openPositionsIsolatedB = userB.openPositionsIsolated
  let openPositionsCrossA = userA.openPositionsCross // B is isolated by default

  if (position.positionType == 'ISOLATED') {
    openPositionsIsolatedA = removeFromArray(openPositionsIsolatedA, position.id)
    openPositionsIsolatedB = removeFromArray(openPositionsIsolatedB, position.id)
  } else {
    openPositionsCrossA = removeFromArray(openPositionsCrossA, position.id)
    openPositionsIsolatedB = removeFromArray(openPositionsIsolatedB, position.id)
  }

  // Reassign the list
  userA.openPositionsIsolated = openPositionsIsolatedA
  userB.openPositionsIsolated = openPositionsIsolatedB
  userA.openPositionsCross = openPositionsCrossA

  userA.save()
  userB.save()
}
