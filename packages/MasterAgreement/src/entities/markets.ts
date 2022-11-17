import {BigInt} from '@graphprotocol/graph-ts'

import {Market} from '../../generated/schema'
import {fetchMarket} from '../fetchers'
import {getMarketType} from '../helpers'

export function createMarket(marketId: BigInt): void {
  const fetchedMarket = fetchMarket(marketId)

  let market = new Market(marketId.toString())
  market.marketId = fetchedMarket.marketId
  market.identifier = fetchedMarket.identifier
  market.marketType = getMarketType(fetchedMarket.marketType)
  market.active = fetchedMarket.active
  market.baseCurrency = fetchedMarket.baseCurrency
  market.quoteCurrency = fetchedMarket.quoteCurrency
  market.symbol = fetchedMarket.symbol
  market.muonPriceFeedId = fetchedMarket.muonPriceFeedId
  market.fundingRateId = fetchedMarket.fundingRateId
  market.save()
}
