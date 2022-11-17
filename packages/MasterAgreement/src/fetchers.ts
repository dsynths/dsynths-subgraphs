import {Address, BigInt} from '@graphprotocol/graph-ts'

import {
  MasterAgreement,
  MasterAgreement__getHedgerByAddressResultHedgerStruct,
  MasterAgreement__getMarketByIdResultMarketStruct,
  MasterAgreement__getPositionResultPositionStruct,
  MasterAgreement__getRequestForQuoteResultRfqStruct
} from '../generated/MasterAgreement/MasterAgreement'

import {MASTER_AGREEMENT_ADDRESS} from '../constants'

export function fetchHedger(hedger: Address): MasterAgreement__getHedgerByAddressResultHedgerStruct {
  const contract = MasterAgreement.bind(MASTER_AGREEMENT_ADDRESS)
  return contract.getHedgerByAddress(hedger).value1
}

export function fetchMarket(marketId: BigInt): MasterAgreement__getMarketByIdResultMarketStruct {
  const contract = MasterAgreement.bind(MASTER_AGREEMENT_ADDRESS)
  return contract.getMarketById(marketId)
}

export function fetchRequestForQuote(rfqId: BigInt): MasterAgreement__getRequestForQuoteResultRfqStruct {
  const contract = MasterAgreement.bind(MASTER_AGREEMENT_ADDRESS)
  return contract.getRequestForQuote(rfqId)
}

export function fetchPosition(positionId: BigInt): MasterAgreement__getPositionResultPositionStruct {
  const contract = MasterAgreement.bind(MASTER_AGREEMENT_ADDRESS)
  return contract.getPosition(positionId)
}
