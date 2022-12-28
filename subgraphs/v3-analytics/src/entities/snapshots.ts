import {BigInt, ethereum} from '@graphprotocol/graph-ts'
import {BIG_INT_ZERO} from 'const'
import {DailySnapshot, HourlySnapshot, MasterAgreement} from '../../generated/schema'

function getHourlySnapshot(timestamp: BigInt): HourlySnapshot {
  const hourlyId = (timestamp.toI32() / 3600).toString()
  let hourlySnapshot = HourlySnapshot.load(hourlyId)
  if (!hourlySnapshot) {
    hourlySnapshot = new HourlySnapshot(hourlyId)
    hourlySnapshot.timestamp = timestamp
    hourlySnapshot.cumulativeRequestForQuotes = BIG_INT_ZERO
    hourlySnapshot.cumulativePositionsIsolated = BIG_INT_ZERO
    hourlySnapshot.cumulativePositionsCross = BIG_INT_ZERO
  }
  return hourlySnapshot
}

function getDailySnapshot(timestamp: BigInt): DailySnapshot {
  const dailyId = (timestamp.toI32() / 86400).toString()
  let dailySnapshot = DailySnapshot.load(dailyId)
  if (!dailySnapshot) {
    dailySnapshot = new DailySnapshot(dailyId)
    dailySnapshot.timestamp = timestamp
    dailySnapshot.cumulativeRequestForQuotes = BIG_INT_ZERO
    dailySnapshot.cumulativePositionsIsolated = BIG_INT_ZERO
    dailySnapshot.cumulativePositionsCross = BIG_INT_ZERO
  }
  return dailySnapshot
}

export function updateHourlySnapshot(ma: MasterAgreement, event: ethereum.Event): void {
  let hourlySnapshot = getHourlySnapshot(event.block.timestamp)
  hourlySnapshot.cumulativeRequestForQuotes = ma.cumulativeRequestForQuotes
  hourlySnapshot.cumulativePositionsIsolated = ma.cumulativePositionsIsolated
  hourlySnapshot.cumulativePositionsCross = ma.cumulativePositionsCross
  hourlySnapshot.save()
}

export function updateDailySnapshot(ma: MasterAgreement, event: ethereum.Event): void {
  let dailySnapshot = getDailySnapshot(event.block.timestamp)
  dailySnapshot.cumulativeRequestForQuotes = ma.cumulativeRequestForQuotes
  dailySnapshot.cumulativePositionsIsolated = ma.cumulativePositionsIsolated
  dailySnapshot.cumulativePositionsCross = ma.cumulativePositionsCross
  dailySnapshot.save()
}
