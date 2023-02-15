import {SCALE} from 'const'
import {
  AddFreeMarginCross,
  AddFreeMarginIsolated,
  Allocate,
  ClosePosition,
  Deallocate,
  Deposit,
  Liquidate,
  OpenPosition,
  RemoveFreeMarginCross,
  SetProtocolLiquidationShare,
  Withdraw
} from '../generated/MasterAgreement/MasterAgreement'
import {onSetProtocolLiquidationShare} from './entities/constants'
import {
  onGlobalAddFreeMargin,
  onGlobalClosePosition,
  onGlobalLiquidatePosition,
  onGlobalOpenPosition
} from './entities/global'
import {
  onPartyAddFreeMarginIsolated,
  onPartyAddFreeMarginCross,
  onPartyAllocate,
  onPartyDeallocate,
  onPartyDeposit,
  onPartyOpenPosition,
  onPartyRemoveFreeMarginCross,
  onPartyWithdraw,
  onPartyClosePosition,
  onPartyLiquidatePosition
} from './entities/parties'
import {convertAmountToDecimal, isIsolated} from './helpers'

/**
 * TRADES
 */

export function handleOpenPosition(event: OpenPosition): void {
  const position = onGlobalOpenPosition(event)
  onPartyOpenPosition(
    event,
    position.partyA,
    convertAmountToDecimal(position.lockedMarginA, SCALE),
    isIsolated(position),
    false,
    position
  )
  onPartyOpenPosition(
    event,
    position.partyB,
    convertAmountToDecimal(position.lockedMarginB, SCALE),
    true,
    true,
    position
  )
}

export function handleClosePosition(event: ClosePosition): void {
  const position = onGlobalClosePosition(event)
  onPartyClosePosition(
    event,
    position.partyA,
    convertAmountToDecimal(position.lockedMarginA, SCALE),
    isIsolated(position),
    position
  )
  onPartyClosePosition(event, position.partyB, convertAmountToDecimal(position.lockedMarginB, SCALE), true, position)
}

export function handleLiquidate(event: Liquidate): void {
  const position = onGlobalLiquidatePosition(event)
  const liquidatedParty = event.params.targetParty

  if (liquidatedParty.equals(position.partyA)) {
    // Liquidate A
    onPartyLiquidatePosition(
      event,
      position.partyA,
      convertAmountToDecimal(position.lockedMarginA, SCALE),
      isIsolated(position),
      position
    )
    // Close B
    onPartyClosePosition(event, position.partyB, convertAmountToDecimal(position.lockedMarginB, SCALE), true, position)
  } else {
    // Liquidate B
    onPartyLiquidatePosition(
      event,
      position.partyB,
      convertAmountToDecimal(position.lockedMarginB, SCALE),
      true,
      position
    )
    // Close A
    onPartyClosePosition(
      event,
      position.partyA,
      convertAmountToDecimal(position.lockedMarginA, SCALE),
      isIsolated(position),
      position
    )
  }
}

/**
 * ACCOUNTS
 */

export function handleDeposit(event: Deposit): void {
  onPartyDeposit(event, event.params.party, convertAmountToDecimal(event.params.amount, SCALE))
}

export function handleWithdraw(event: Withdraw): void {
  onPartyWithdraw(event, event.params.party, convertAmountToDecimal(event.params.amount, SCALE))
}

export function handleAllocate(event: Allocate): void {
  onPartyAllocate(event, event.params.party, convertAmountToDecimal(event.params.amount, SCALE))
}

export function handleDeallocate(event: Deallocate): void {
  onPartyDeallocate(event, event.params.party, convertAmountToDecimal(event.params.amount, SCALE))
}

export function handleAddFreeMarginIsolated(event: AddFreeMarginIsolated): void {
  onGlobalAddFreeMargin(event, convertAmountToDecimal(event.params.amount, SCALE), true)
  onPartyAddFreeMarginIsolated(event, event.params.party, convertAmountToDecimal(event.params.amount, SCALE))
}

export function handleAddFreeMarginCross(event: AddFreeMarginCross): void {
  onGlobalAddFreeMargin(event, convertAmountToDecimal(event.params.amount, SCALE), false)
  onPartyAddFreeMarginCross(event, event.params.party, convertAmountToDecimal(event.params.amount, SCALE))
}

export function handleRemoveFreeMarginCross(event: RemoveFreeMarginCross): void {
  onPartyRemoveFreeMarginCross(event, event.params.party, convertAmountToDecimal(event.params.amount, SCALE))
}

/**
 * CONSTANTS
 */
export function handleSetProtocolLiquidationShare(event: SetProtocolLiquidationShare): void {
  onSetProtocolLiquidationShare(event.params.newShare)
}
