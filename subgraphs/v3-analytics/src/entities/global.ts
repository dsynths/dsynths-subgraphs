import {BigDecimal, ethereum} from '@graphprotocol/graph-ts'
import {BIG_DECIMAL_ZERO, BIG_INT_ONE, BIG_INT_ZERO, SCALE} from 'const'

import {Global, GlobalDailySnapshot} from '../../generated/schema'
import {MASTER_AGREEMENT_ADDRESS} from '../../constants'
import {convertAmountToDecimal, getPositionType} from '../helpers'
import {
  ClosePosition,
  Liquidate,
  MasterAgreement__getPositionResultPositionStruct,
  OpenPosition
} from '../../generated/MasterAgreement/MasterAgreement'
import {fetchPosition} from './positions'
import {calculateProtocolLiquidationShare} from './constants'

/**
 *  HELPERS
 */
function getGlobalEntity(): Global {
  const globalId = MASTER_AGREEMENT_ADDRESS.toHexString()
  let global = Global.load(globalId)
  if (!global) {
    global = new Global(globalId)
    // Cumulative
    global.cumulativeProtocolFees = BIG_DECIMAL_ZERO
    global.cumulativeProtocolRevenue = BIG_DECIMAL_ZERO
    global.cumulativeLiquidationFees = BIG_DECIMAL_ZERO
    global.cumulativeNotionalVolume = BIG_DECIMAL_ZERO
    global.cumulativeUniqueParties = BIG_INT_ZERO
    // Current
    global.currentLockedMarginIsolated = BIG_DECIMAL_ZERO
    global.currentLockedMarginCross = BIG_DECIMAL_ZERO
    global.currentOpenInterest = BIG_DECIMAL_ZERO
    global.save()
  }
  return global
}

function getGlobalDailySnapshot(event: ethereum.Event): GlobalDailySnapshot {
  const timestamp = event.block.timestamp.toI32()
  const dayID = timestamp / 86400
  const dayStartTimestamp = dayID * 86400

  let dailySnapshot = GlobalDailySnapshot.load(dayID.toString())
  if (!dailySnapshot) {
    dailySnapshot = new GlobalDailySnapshot(dayID.toString())
    dailySnapshot.date = dayStartTimestamp
    // Daily
    dailySnapshot.dailyProtocolFees = BIG_DECIMAL_ZERO
    dailySnapshot.dailyProtocolRevenue = BIG_DECIMAL_ZERO
    dailySnapshot.dailyLiquidationFees = BIG_DECIMAL_ZERO
    dailySnapshot.dailyNotionalVolume = BIG_DECIMAL_ZERO
    dailySnapshot.dailyUniqueParties = BIG_INT_ZERO
    // Current
    dailySnapshot.currentLockedMarginIsolated = BIG_DECIMAL_ZERO
    dailySnapshot.currentLockedMarginCross = BIG_DECIMAL_ZERO
    dailySnapshot.currentOpenInterest = BIG_DECIMAL_ZERO
    dailySnapshot.save()
  }
  return dailySnapshot
}

/**
 * UPDATERS
 */
export function onGlobalOpenPosition(event: OpenPosition): MasterAgreement__getPositionResultPositionStruct {
  const position = fetchPosition(event.params.positionId)

  const positionType = getPositionType(position.positionType)
  const protocolFee = convertAmountToDecimal(position.protocolFeePaid, SCALE)
  const lockedMarginA = convertAmountToDecimal(position.lockedMarginA, SCALE)
  const lockedMarginB = convertAmountToDecimal(position.lockedMarginB, SCALE)
  const notionalValue = convertAmountToDecimal(position.initialNotionalUsd, SCALE)

  // Update global state
  const global = getGlobalEntity()
  global.cumulativeProtocolFees = global.cumulativeProtocolFees.plus(protocolFee)
  global.cumulativeProtocolRevenue = global.cumulativeProtocolRevenue.plus(protocolFee)
  global.cumulativeNotionalVolume = global.cumulativeNotionalVolume.plus(notionalValue)
  global.currentOpenInterest = global.currentOpenInterest.plus(notionalValue)

  if (positionType === 'ISOLATED') {
    global.currentLockedMarginIsolated = global.currentLockedMarginIsolated.plus(lockedMarginA).plus(lockedMarginB)
  } else {
    global.currentLockedMarginIsolated = global.currentLockedMarginIsolated.plus(lockedMarginB)
    global.currentLockedMarginCross = global.currentLockedMarginCross.plus(lockedMarginA)
  }

  // Create daily snapshot
  const dailySnapshot = getGlobalDailySnapshot(event)
  dailySnapshot.dailyProtocolFees = dailySnapshot.dailyProtocolFees.plus(protocolFee)
  dailySnapshot.dailyProtocolRevenue = dailySnapshot.dailyProtocolRevenue.plus(protocolFee)
  dailySnapshot.dailyNotionalVolume = dailySnapshot.dailyNotionalVolume.plus(notionalValue)
  dailySnapshot.currentLockedMarginIsolated = global.currentLockedMarginIsolated
  dailySnapshot.currentLockedMarginCross = global.currentLockedMarginCross
  dailySnapshot.currentOpenInterest = global.currentOpenInterest

  global.save()
  dailySnapshot.save()

  return position
}

export function onGlobalClosePosition(event: ClosePosition): MasterAgreement__getPositionResultPositionStruct {
  const position = fetchPosition(event.params.positionId)
  const notionalValue = convertAmountToDecimal(position.initialNotionalUsd, SCALE)
  const positionType = getPositionType(position.positionType)
  const lockedMarginA = convertAmountToDecimal(position.lockedMarginA, SCALE)
  const lockedMarginB = convertAmountToDecimal(position.lockedMarginB, SCALE)

  // Update global state
  const global = getGlobalEntity()
  global.cumulativeNotionalVolume = global.cumulativeNotionalVolume.plus(notionalValue)
  global.currentOpenInterest = global.currentOpenInterest.minus(notionalValue)

  if (positionType === 'ISOLATED') {
    global.currentLockedMarginIsolated = global.currentLockedMarginIsolated.minus(lockedMarginA).minus(lockedMarginB)
  } else {
    global.currentLockedMarginIsolated = global.currentLockedMarginIsolated.minus(lockedMarginB)
    global.currentLockedMarginCross = global.currentLockedMarginCross.minus(lockedMarginA)
  }

  // Create daily snapshot
  const dailySnapshot = getGlobalDailySnapshot(event)
  dailySnapshot.dailyNotionalVolume = dailySnapshot.dailyNotionalVolume.plus(notionalValue)
  dailySnapshot.currentLockedMarginIsolated = global.currentLockedMarginIsolated
  dailySnapshot.currentLockedMarginCross = global.currentLockedMarginCross
  dailySnapshot.currentOpenInterest = global.currentOpenInterest

  global.save()
  dailySnapshot.save()

  return position
}

export function onGlobalLiquidatePosition(event: Liquidate): MasterAgreement__getPositionResultPositionStruct {
  const position = fetchPosition(event.params.positionId)
  const notionalValue = convertAmountToDecimal(position.initialNotionalUsd, SCALE)
  const positionType = getPositionType(position.positionType)
  const lockedMarginA = convertAmountToDecimal(position.lockedMarginA, SCALE)
  const lockedMarginB = convertAmountToDecimal(position.lockedMarginB, SCALE)
  const liquidationFee = convertAmountToDecimal(position.liquidationFee, SCALE)
  const protocolLiquidationShare = calculateProtocolLiquidationShare(liquidationFee)

  // Update global state
  const global = getGlobalEntity()
  global.cumulativeProtocolRevenue = global.cumulativeProtocolRevenue.plus(protocolLiquidationShare)
  global.cumulativeLiquidationFees = global.cumulativeLiquidationFees.plus(liquidationFee)
  global.cumulativeNotionalVolume = global.cumulativeNotionalVolume.plus(notionalValue)
  global.currentOpenInterest = global.currentOpenInterest.minus(notionalValue)

  if (positionType === 'ISOLATED') {
    global.currentLockedMarginIsolated = global.currentLockedMarginIsolated.minus(lockedMarginA).minus(lockedMarginB)
  } else {
    global.currentLockedMarginIsolated = global.currentLockedMarginIsolated.minus(lockedMarginB)
    global.currentLockedMarginCross = global.currentLockedMarginCross.minus(lockedMarginA)
  }

  // Create daily snapshot
  const dailySnapshot = getGlobalDailySnapshot(event)
  dailySnapshot.dailyProtocolRevenue = dailySnapshot.dailyProtocolRevenue.plus(protocolLiquidationShare)
  dailySnapshot.dailyLiquidationFees = dailySnapshot.dailyLiquidationFees.plus(liquidationFee)
  dailySnapshot.dailyNotionalVolume = dailySnapshot.dailyNotionalVolume.plus(notionalValue)
  dailySnapshot.currentLockedMarginIsolated = global.currentLockedMarginIsolated
  dailySnapshot.currentLockedMarginCross = global.currentLockedMarginCross
  dailySnapshot.currentOpenInterest = global.currentOpenInterest

  global.save()
  dailySnapshot.save()

  return position
}

export function onGlobalAddFreeMargin(event: ethereum.Event, amount: BigDecimal, isolated: boolean): void {
  // Update global state
  const global = getGlobalEntity()
  if (isolated) {
    global.currentLockedMarginIsolated = global.currentLockedMarginIsolated.plus(amount)
  } else {
    global.currentLockedMarginCross = global.currentLockedMarginCross.plus(amount)
  }

  // Create daily snapshot
  const dailySnapshot = getGlobalDailySnapshot(event)
  dailySnapshot.currentLockedMarginIsolated = global.currentLockedMarginIsolated
  dailySnapshot.currentLockedMarginCross = global.currentLockedMarginCross
  dailySnapshot.currentOpenInterest = global.currentOpenInterest

  global.save()
  dailySnapshot.save()
}

export function addGlobalUniqueParty(event: ethereum.Event): void {
  // Update global state
  const global = getGlobalEntity()
  global.cumulativeUniqueParties = global.cumulativeUniqueParties.plus(BIG_INT_ONE)

  // Create daily snapshot
  const dailySnapshot = getGlobalDailySnapshot(event)
  dailySnapshot.dailyUniqueParties = dailySnapshot.dailyUniqueParties.plus(BIG_INT_ONE)

  global.save()
  dailySnapshot.save()
}
