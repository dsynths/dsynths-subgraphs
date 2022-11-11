import {Bytes, log} from '@graphprotocol/graph-ts'
import {Position, RequestForQuote, User} from '../../generated/schema'
import {removeFromArray} from '../helpers'

export function getUser(party: Bytes): User {
  let user = User.load(party.toHexString())
  if (!user) {
    user = new User(party.toHexString())
    user.openRequestForQuotes = []
    user.openPositionsIsolated = []
    user.openPositionsCross = []
    user.save()
  }
  return user
}

export function addUserOpenRequestForQuote(partyA: Bytes, partyB: Bytes, rfq: RequestForQuote): void {
  let userA = getUser(partyA)
  let userB = getUser(partyB)

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

export function removeUserOpenRequestForQuote(partyA: Bytes, partyB: Bytes, rfq: RequestForQuote): void {
  let userA = getUser(partyA)
  let userB = getUser(partyB)

  // Copy the list so we can remove from it
  const rfqListA = removeFromArray(userA.openRequestForQuotes, rfq.id)
  const rfqListB = removeFromArray(userB.openRequestForQuotes, rfq.id)

  // Reassign the list
  userA.openRequestForQuotes = rfqListA
  userB.openRequestForQuotes = rfqListB

  userA.save()
  userB.save()
}

export function addUserPosition(partyA: Bytes, partyB: Bytes, position: Position): void {
  let userA = getUser(partyA)
  let userB = getUser(partyB)

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
