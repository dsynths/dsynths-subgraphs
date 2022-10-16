import {Address} from '@graphprotocol/graph-ts'
import {User} from '../../generated/schema'

export function getUser(party: Address): User {
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
