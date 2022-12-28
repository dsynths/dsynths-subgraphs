import {Address} from '@graphprotocol/graph-ts'

import {Hedger} from '../../generated/schema'
import {fetchHedger} from '../fetchers'

export function enlist(address: Address): void {
  const fetchedHedger = fetchHedger(address)

  let hedger = new Hedger(address.toHexString())
  hedger.address = address
  hedger.pricingURLs = fetchedHedger.pricingWssURLs
  hedger.marketsURLs = fetchedHedger.marketsHttpsURLs
  hedger.save()
}
