import {BigInt} from '@graphprotocol/graph-ts'

import {
  MasterAgreement,
  MasterAgreement__getMarketByIdResultMarketStruct
} from '../../generated/MasterAgreement/MasterAgreement'
import {Market} from '../../generated/schema'
import {MASTER_AGREEMENT_ADDRESS} from '../../constants'

export function createMarket(marketId: BigInt): void {
  const fetchedMarket = fetchMarket(marketId)
  let market = new Market(marketId.toString())
  market.marketId = fetchedMarket.marketId
  market.identifier = fetchedMarket.identifier
  market.marketType = getMarketType(fetchedMarket.marketType)
  market.tradingSession = getTradingSession(fetchedMarket.tradingSession)
  market.active = fetchedMarket.active
  market.baseCurrency = fetchedMarket.baseCurrency
  market.quoteCurrency = fetchedMarket.quoteCurrency
  market.symbol = fetchedMarket.symbol
  market.save()
}

function fetchMarket(marketId: BigInt): MasterAgreement__getMarketByIdResultMarketStruct {
  const contract = MasterAgreement.bind(MASTER_AGREEMENT_ADDRESS)
  return contract.getMarketById(marketId)
}

function getMarketType(marketType: number): string {
  if (marketType == 0) {
    return 'FOREX'
  } else if (marketType == 1) {
    return 'CRYPTO'
  } else {
    return 'STOCK'
  }
}

function getTradingSession(tradingSession: number): string {
  if (tradingSession == 0) {
    return '_24_7'
  } else {
    return '_24_5'
  }
}
