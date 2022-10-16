import {Address} from '@graphprotocol/graph-ts'

import {
  MasterAgreement,
  MasterAgreement__getHedgerByAddressResultHedgerStruct
} from '../../generated/MasterAgreement/MasterAgreement'
import {Hedger} from '../../generated/schema'

import {MASTER_AGREEMENT_ADDRESS} from '../../constants'
import {getUser} from './user'

export function enlist(address: Address): void {
  const fetchedHedger = fetchHedger(address)
  let hedger = new Hedger(address.toHexString())
  hedger.address = address
  hedger.pricingURLs = fetchedHedger.pricingWssURLs
  hedger.marketsURLs = fetchedHedger.marketsHttpsURLs
  hedger.user = getUser(address).id
  hedger.save()
}

function fetchHedger(hedger: Address): MasterAgreement__getHedgerByAddressResultHedgerStruct {
  const contract = MasterAgreement.bind(MASTER_AGREEMENT_ADDRESS)
  return contract.getHedgerByAddress(hedger).value1
}
