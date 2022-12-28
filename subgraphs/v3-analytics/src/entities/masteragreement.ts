import {BIG_INT_ONE, BIG_INT_ZERO} from 'const'
import {MASTER_AGREEMENT_ADDRESS} from '../../constants'
import {MasterAgreement, Position, RequestForQuote} from '../../generated/schema'
import {removeFromArray} from '../helpers'

const MASTER_AGREEMENT_ID = MASTER_AGREEMENT_ADDRESS.toHexString()

export function getMasterAgreement(): MasterAgreement {
  let masterAgreement = MasterAgreement.load(MASTER_AGREEMENT_ID)
  if (!masterAgreement) {
    masterAgreement = new MasterAgreement(MASTER_AGREEMENT_ID)
    masterAgreement.activeRequestForQuotes = []
    masterAgreement.activePositionsIsolated = []
    masterAgreement.activePositionsCross = []
    masterAgreement.cumulativeRequestForQuotes = BIG_INT_ZERO
    masterAgreement.cumulativePositionsIsolated = BIG_INT_ZERO
    masterAgreement.cumulativePositionsCross = BIG_INT_ZERO
  }
  return masterAgreement
}

export function addActiveRequestForQuote(rfq: RequestForQuote): MasterAgreement {
  let ma = getMasterAgreement()

  // Update the list of active RFQs
  let active = ma.activeRequestForQuotes
  active.push(rfq.id)
  ma.activeRequestForQuotes = active

  // Update global count
  ma.cumulativeRequestForQuotes = ma.cumulativeRequestForQuotes.plus(BIG_INT_ONE)

  ma.save()

  return ma
}

export function removeActiveRequestForQuote(rfq: RequestForQuote): MasterAgreement {
  let ma = getMasterAgreement()

  // Update the list of active RFQs
  const active = ma.activeRequestForQuotes
  const filtered = removeFromArray(active, rfq.id)
  ma.activeRequestForQuotes = filtered
  ma.save()

  return ma
}

export function addActivePosition(position: Position): MasterAgreement {
  if (position.positionType == 'ISOLATED') {
    return addActivePositionIsolated(position)
  } else {
    return addActivePositionCross(position)
  }
}

export function removeActivePosition(position: Position): MasterAgreement {
  if (position.positionType == 'ISOLATED') {
    return removeActivePositionIsolated(position)
  } else {
    return removeActivePositionCross(position)
  }
}

function addActivePositionIsolated(position: Position): MasterAgreement {
  let ma = getMasterAgreement()

  // Update the list of active positions
  let active = ma.activePositionsIsolated
  active.push(position.id)
  ma.activePositionsIsolated = active

  // Update global count
  ma.cumulativePositionsIsolated = ma.cumulativePositionsIsolated.plus(BIG_INT_ONE)

  ma.save()

  return ma
}

function removeActivePositionIsolated(position: Position): MasterAgreement {
  let ma = getMasterAgreement()

  // Update the list of active positions
  const active = ma.activePositionsIsolated
  const filtered = removeFromArray(active, position.id)
  ma.activePositionsIsolated = filtered
  ma.save()

  return ma
}

function addActivePositionCross(position: Position): MasterAgreement {
  let ma = getMasterAgreement()

  // Update the list of active positions
  let active = ma.activePositionsCross
  active.push(position.id)
  ma.activePositionsCross = active

  // Update global count
  ma.cumulativePositionsCross = ma.cumulativePositionsCross.plus(BIG_INT_ONE)

  ma.save()

  return ma
}

function removeActivePositionCross(position: Position): MasterAgreement {
  let ma = getMasterAgreement()

  // Update the list of active positions
  const active = ma.activePositionsCross
  const filtered = removeFromArray(active, position.id)
  ma.activePositionsCross = filtered
  ma.save()

  return ma
}
