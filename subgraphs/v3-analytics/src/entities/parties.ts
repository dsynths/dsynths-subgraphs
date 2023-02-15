import {Address, BigDecimal, Bytes, ethereum} from '@graphprotocol/graph-ts'
import {BIG_DECIMAL_ZERO, SCALE} from 'const'

import {FREE_MARGIN_UPGRADE_BLOCK, MASTER_AGREEMENT_ADDRESS} from '../../constants'
import {
  MasterAgreement,
  MasterAgreement__getPositionResultPositionStruct
} from '../../generated/MasterAgreement/MasterAgreement'
import {Party, PartyDailySnapshot, PartySnapshot} from '../../generated/schema'
import {convertAmountToDecimal} from '../helpers'
import {addGlobalUniqueParty} from './global'

type Position = MasterAgreement__getPositionResultPositionStruct

/**
 * HELPERS
 */
function getPartyEntity(event: ethereum.Event, address: Bytes): Party {
  const id = address.toHexString()
  let party = Party.load(id)
  if (!party) {
    party = new Party(id)
    party.address = address
    // Cumulative
    party.cumulativeProtocolFeesPaid = BIG_DECIMAL_ZERO
    party.cumulativeLiquidationFeesPaid = BIG_DECIMAL_ZERO
    party.cumulativeCVAPaid = BIG_DECIMAL_ZERO
    party.cumulativeNotionalVolume = BIG_DECIMAL_ZERO
    // Current
    party.currentAccountBalance = BIG_DECIMAL_ZERO
    party.currentMarginBalance = BIG_DECIMAL_ZERO
    party.currentLockedMarginIsolated = BIG_DECIMAL_ZERO
    party.currentLockedMarginCross = BIG_DECIMAL_ZERO
    party.currentLockedCVA = BIG_DECIMAL_ZERO
    party.currentOpenInterest = BIG_DECIMAL_ZERO
    party.save()

    // Register party as unique
    addGlobalUniqueParty(event)
  }
  return party
}

function getPartySnapshot(event: ethereum.Event, party: Party): PartySnapshot {
  const id = event.block.timestamp.toI32().toString() + '-' + party.address.toHexString()
  let snapshot = PartySnapshot.load(id)
  if (!snapshot) {
    snapshot = new PartySnapshot(id)
    snapshot.address = party.address
    snapshot.timestamp = event.block.timestamp.toI32()
    snapshot.blockNumber = event.block.number
    // Current
    snapshot.currentAccountBalance = party.currentAccountBalance
    snapshot.currentMarginBalance = party.currentMarginBalance
    snapshot.currentLockedMarginIsolated = party.currentLockedMarginIsolated
    snapshot.currentLockedMarginCross = party.currentLockedMarginCross
    snapshot.currentLockedCVA = party.currentLockedCVA
    snapshot.currentOpenInterest = party.currentOpenInterest
    snapshot.save()
  }
  return snapshot
}

function getPartyDailySnapshot(event: ethereum.Event, party: Party): PartyDailySnapshot {
  const timestamp = event.block.timestamp.toI32()
  const dayID = timestamp / 86400
  const dayStartTimestamp = dayID * 86400
  const id = dayID.toString() + '-' + party.address.toHexString()

  let dailySnapshot = PartyDailySnapshot.load(id)
  if (!dailySnapshot) {
    dailySnapshot = new PartyDailySnapshot(id)
    dailySnapshot.address = party.address
    dailySnapshot.date = dayStartTimestamp
    // Daily
    dailySnapshot.dailyNotionalVolume = BIG_DECIMAL_ZERO
    dailySnapshot.dailyProtocolFeesPaid = BIG_DECIMAL_ZERO
    dailySnapshot.dailyLiquidationFeesPaid = BIG_DECIMAL_ZERO
    dailySnapshot.dailyCVAPaid = BIG_DECIMAL_ZERO
    // Current
    dailySnapshot.currentLockedMarginIsolated = BIG_DECIMAL_ZERO
    dailySnapshot.currentLockedMarginCross = BIG_DECIMAL_ZERO
    dailySnapshot.currentLockedCVA = BIG_DECIMAL_ZERO
    dailySnapshot.currentOpenInterest = BIG_DECIMAL_ZERO
    dailySnapshot.save()
  }
  return dailySnapshot
}

/**
 * UPDATERS
 */
export function onPartyOpenPosition(
  event: ethereum.Event,
  address: Bytes,
  lockedMargin: BigDecimal,
  isolated: boolean,
  isHedger: boolean,
  position: Position
): void {
  const marginBalance = fetchMarginBalance(address)
  const cva = convertAmountToDecimal(position.cva, SCALE)
  const notionalValue = convertAmountToDecimal(position.initialNotionalUsd, SCALE)
  const protocolFee = convertAmountToDecimal(position.protocolFeePaid, SCALE)

  // Global Cumulative
  const party = getPartyEntity(event, address)
  party.cumulativeNotionalVolume = party.cumulativeNotionalVolume.plus(notionalValue)
  if (!isHedger) {
    party.cumulativeProtocolFeesPaid = party.cumulativeProtocolFeesPaid.plus(protocolFee)
  }

  // Global Current
  party.currentMarginBalance = marginBalance
  party.currentLockedCVA = party.currentLockedCVA.plus(cva)
  party.currentOpenInterest = party.currentOpenInterest.plus(notionalValue)
  if (isolated) {
    party.currentLockedMarginIsolated = party.currentLockedMarginIsolated.plus(lockedMargin)
  } else {
    party.currentLockedMarginCross = party.currentLockedMarginCross.plus(lockedMargin)
  }

  // DailySnapshot Daily
  const dailySnapshot = getPartyDailySnapshot(event, party)
  dailySnapshot.dailyNotionalVolume = dailySnapshot.dailyNotionalVolume.plus(notionalValue)
  if (!isHedger) {
    dailySnapshot.dailyProtocolFeesPaid = dailySnapshot.dailyProtocolFeesPaid.plus(protocolFee)
  }

  // DailySnapshot Current
  dailySnapshot.currentLockedMarginIsolated = party.currentLockedMarginIsolated
  dailySnapshot.currentLockedMarginCross = party.currentLockedMarginCross
  dailySnapshot.currentLockedCVA = party.currentLockedCVA
  dailySnapshot.currentOpenInterest = party.currentOpenInterest

  party.save()
  dailySnapshot.save()

  createPartySnapshot(event, party)
}

export function onPartyClosePosition(
  event: ethereum.Event,
  address: Bytes,
  lockedMargin: BigDecimal,
  isolated: boolean,
  position: Position
): void {
  const marginBalance = fetchMarginBalance(address)
  const cva = convertAmountToDecimal(position.cva, SCALE)
  const notionalValue = convertAmountToDecimal(position.initialNotionalUsd, SCALE)

  // Global Cumulative
  const party = getPartyEntity(event, address)
  party.cumulativeNotionalVolume = party.cumulativeNotionalVolume.plus(notionalValue)

  // Global Current
  party.currentMarginBalance = marginBalance
  party.currentLockedCVA = party.currentLockedCVA.minus(cva)
  party.currentOpenInterest = party.currentOpenInterest.minus(notionalValue)
  if (isolated) {
    party.currentLockedMarginIsolated = party.currentLockedMarginIsolated.minus(lockedMargin)
  } else {
    party.currentLockedMarginCross = fetchLockedMarginCross(address)
  }

  // DailySnapshot Daily
  const dailySnapshot = getPartyDailySnapshot(event, party)
  dailySnapshot.dailyNotionalVolume = dailySnapshot.dailyNotionalVolume.plus(notionalValue)

  // DailySnapshot Current
  dailySnapshot.currentLockedMarginIsolated = party.currentLockedMarginIsolated
  dailySnapshot.currentLockedMarginCross = party.currentLockedMarginCross
  dailySnapshot.currentLockedCVA = party.currentLockedCVA
  dailySnapshot.currentOpenInterest = party.currentOpenInterest

  party.save()
  dailySnapshot.save()

  createPartySnapshot(event, party)
}

export function onPartyLiquidatePosition(
  event: ethereum.Event,
  address: Bytes,
  lockedMargin: BigDecimal,
  isolated: boolean,
  position: Position
): void {
  const marginBalance = fetchMarginBalance(address)
  const cva = convertAmountToDecimal(position.cva, SCALE)
  const liquidationFee = convertAmountToDecimal(position.liquidationFee, SCALE)
  const notionalValue = convertAmountToDecimal(position.initialNotionalUsd, SCALE)

  // Global Cumulative
  const party = getPartyEntity(event, address)
  party.cumulativeLiquidationFeesPaid = party.cumulativeLiquidationFeesPaid.plus(liquidationFee)
  party.cumulativeCVAPaid = party.cumulativeCVAPaid.plus(cva)
  party.cumulativeNotionalVolume = party.cumulativeNotionalVolume.plus(notionalValue)

  // Global Current
  party.currentMarginBalance = marginBalance
  party.currentLockedCVA = party.currentLockedCVA.minus(cva)
  party.currentOpenInterest = party.currentOpenInterest.minus(notionalValue)
  if (isolated) {
    party.currentLockedMarginIsolated = party.currentLockedMarginIsolated.minus(lockedMargin)
  } else {
    party.currentLockedMarginCross = fetchLockedMarginCross(address)
  }

  // DailySnapshot Daily
  const dailySnapshot = getPartyDailySnapshot(event, party)
  dailySnapshot.dailyNotionalVolume = dailySnapshot.dailyNotionalVolume.plus(notionalValue)
  dailySnapshot.dailyLiquidationFeesPaid = dailySnapshot.dailyLiquidationFeesPaid.plus(liquidationFee)
  dailySnapshot.dailyCVAPaid = dailySnapshot.dailyCVAPaid.plus(cva)

  // DailySnapshot Current
  dailySnapshot.currentLockedMarginIsolated = party.currentLockedMarginIsolated
  dailySnapshot.currentLockedMarginCross = party.currentLockedMarginCross
  dailySnapshot.currentLockedCVA = party.currentLockedCVA
  dailySnapshot.currentOpenInterest = party.currentOpenInterest

  party.save()
  dailySnapshot.save()

  createPartySnapshot(event, party)
}

export function onPartyDeposit(event: ethereum.Event, address: Bytes, amount: BigDecimal): void {
  const party = getPartyEntity(event, address)
  party.currentAccountBalance = party.currentAccountBalance.plus(amount)
  party.save()

  createPartySnapshot(event, party)
}

export function onPartyWithdraw(event: ethereum.Event, address: Bytes, amount: BigDecimal): void {
  const party = getPartyEntity(event, address)
  party.currentAccountBalance = party.currentAccountBalance.minus(amount)
  party.save()

  createPartySnapshot(event, party)
}

export function onPartyAllocate(event: ethereum.Event, address: Bytes, amount: BigDecimal): void {
  const party = getPartyEntity(event, address)
  party.currentAccountBalance = party.currentAccountBalance.minus(amount)
  party.currentMarginBalance = party.currentMarginBalance.plus(amount)
  party.save()

  createPartySnapshot(event, party)
}

export function onPartyDeallocate(event: ethereum.Event, address: Bytes, amount: BigDecimal): void {
  const party = getPartyEntity(event, address)
  party.currentAccountBalance = party.currentAccountBalance.plus(amount)
  party.currentMarginBalance = party.currentMarginBalance.minus(amount)
  party.save()

  createPartySnapshot(event, party)
}

export function onPartyAddFreeMarginIsolated(event: ethereum.Event, address: Bytes, amount: BigDecimal): void {
  const party = getPartyEntity(event, address)
  if (event.block.number.ge(FREE_MARGIN_UPGRADE_BLOCK)) {
    party.currentAccountBalance = party.currentAccountBalance.minus(amount)
  } else {
    party.currentMarginBalance = party.currentMarginBalance.minus(amount)
  }
  party.currentLockedMarginIsolated = party.currentLockedMarginIsolated.plus(amount)
  party.save()

  createPartySnapshot(event, party)
}

export function onPartyAddFreeMarginCross(event: ethereum.Event, address: Bytes, amount: BigDecimal): void {
  const party = getPartyEntity(event, address)
  party.currentAccountBalance = party.currentAccountBalance.minus(amount)
  party.currentLockedMarginCross = party.currentLockedMarginCross.plus(amount)
  party.save()

  createPartySnapshot(event, party)
}

export function onPartyRemoveFreeMarginCross(event: ethereum.Event, address: Bytes, amount: BigDecimal): void {
  const party = getPartyEntity(event, address)
  party.currentMarginBalance = party.currentMarginBalance.plus(amount)
  party.currentLockedMarginCross = party.currentLockedMarginCross.minus(amount)
  party.save()

  createPartySnapshot(event, party)
}

function createPartySnapshot(event: ethereum.Event, party: Party): void {
  const snapshot = getPartySnapshot(event, party)
  snapshot.currentAccountBalance = party.currentAccountBalance
  snapshot.currentMarginBalance = party.currentMarginBalance
  snapshot.currentLockedMarginIsolated = party.currentLockedMarginIsolated
  snapshot.currentLockedMarginCross = party.currentLockedMarginCross
  snapshot.currentLockedCVA = party.currentLockedCVA
  snapshot.save()
}

/**
 * FETCHERS
 */

function fetchMarginBalance(party: Bytes): BigDecimal {
  const contract = MasterAgreement.bind(MASTER_AGREEMENT_ADDRESS)
  return convertAmountToDecimal(contract.getMarginBalance(Address.fromBytes(party)), SCALE)
}

function fetchLockedMarginCross(party: Bytes): BigDecimal {
  const contract = MasterAgreement.bind(MASTER_AGREEMENT_ADDRESS)
  return convertAmountToDecimal(contract.getLockedMarginCross(Address.fromBytes(party)), SCALE)
}

// {
//   globals(first: 1) {
//     id
//     cumulativeProtocolFees
//     cumulativeLiquidationFees
//     cumulativeLockedMarginIsolated
//     cumulativeLockedMarginCross
//     cumulativeNotionalVolume
//     openInterest
//     uniqueParties
//   }
//   globalDailySnapshots(first: 5, orderBy: date, orderDirection: desc) {
//     id
//     date
//     protocolFees
//     liquidationFees
//     lockedMarginCross
//     lockedMarginIsolated
//     notionalVolume
//     openInterest
//     uniqueParties
//   }
//   parties(first: 1) {
//     accountBalance
//     address
//     cumulativeCVAPaid
//     cumulativeLiquidationFeesPaid
//     cumulativeNotionalVolume
//     cumulativeProtocolFeesPaid
//     lockedCVA
//     lockedMarginCross
//     lockedMarginIsolated
//     marginBalance
//     openInterest
//   }
//   partySnapshots(
//     orderBy: timestamp
//     orderDirection: desc
//     first: 5
//     where: {address: "0xccfd0f473738b8bdc87b94cd45622ddd9b00fe91"}
//   ) {
//     timestamp
//     blockNumber
//     address
//     lockedMarginIsolated
//     lockedMarginCross
//     lockedCVA
//     accountBalance
//     marginBalance
//   }
//   partyDailySnapshots(first: 5, orderDirection: desc, orderBy: date,
//     where: {address: "0xccfd0f473738b8bdc87b94cd45622ddd9b00fe91"}
//   ) {
//     address
//     cvaPaid
//     liquidationFeesPaid
//     notionalVolume
//     openInterest
//     protocolFeesPaid
//   }
// }
