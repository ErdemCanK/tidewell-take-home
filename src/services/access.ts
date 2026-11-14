import { db } from '../lib/db'

/**
 * Who may see what. Every controller goes through here; nothing reads a
 * resident's record without first naming the person who is asking.
 */

export class AccessDenied extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AccessDenied'
  }
}

/** The residents a coordinator is responsible for. Coordinators only. */
export async function caseloadFor(coordinatorId: string) {
  const actor = await db.person.findUnique({ where: { id: coordinatorId }, select: { role: true, isActive: true } })
  if (!actor || actor.role !== 'COORDINATOR' || !actor.isActive) {
    throw new AccessDenied('Only an active coordinator has a caseload')
  }
  return db.person.findMany({
    where: { role: 'RESIDENT', coordinatorId, isActive: true },
    select: { id: true, area: true, birthYear: true, nameEncrypted: true },
    orderBy: { id: 'asc' },
  })
}

/** True when `actorId` is the resident, their coordinator, or an admin. */
export async function canSeeResident(actorId: string, residentId: string): Promise<boolean> {
  if (actorId === residentId) return true
  const [actor, resident] = await Promise.all([
    db.person.findUnique({ where: { id: actorId }, select: { role: true, isActive: true } }),
    db.person.findUnique({ where: { id: residentId }, select: { coordinatorId: true } }),
  ])
  if (!actor?.isActive || !resident) return false
  if (actor.role === 'ADMIN') return true
  return actor.role === 'COORDINATOR' && resident.coordinatorId === actorId
}
