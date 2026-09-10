import pool from '@/lib/db';

// ============================================
// Types
// ============================================
export type ActionType = 'create' | 'update' | 'delete';
export type EntityType = 'user' | 'role' | 'city' | 'profile';

export interface ActorInfo {
  userId: number;
  userName: string;
}

export interface LogActivityOptions {
  actor: ActorInfo;
  action: ActionType;
  entityType: EntityType;
  entityId?: number | null;
  entityName?: string | null;
  changes?: Record<string, any> | null;
  request?: Request;
}

// ============================================
// Labels
// ============================================
const ACTION_LABEL: Record<ActionType, string> = {
  create: 'created',
  update: 'updated',
  delete: 'deleted',
};

const ENTITY_LABEL: Record<EntityType, string> = {
  user: 'User',
  role: 'Role',
  city: 'City',
  profile: 'Profile',
};

const ENTITY_LINK: Record<EntityType, string> = {
  user: '/admin/users',
  role: '/admin/roles',
  city: '/admin/cities',
  profile: '/admin/profile',
};

// ============================================
// Helpers
// ============================================
function extractMeta(request?: Request) {
  if (!request) return { ip: null, ua: null };
  const h = request.headers;
  return {
    ip:
      h.get('x-forwarded-for')?.split(',')[0].trim() ||
      h.get('x-real-ip') ||
      null,
    ua: h.get('user-agent') || null,
  };
}

async function getAllAdminIds(): Promise<number[]> {
  try {
    const [rows] = (await pool.query(
      `SELECT DISTINCT u.id
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN roles r ON r.id = ur.role_id
       WHERE u.is_active = 1
         AND (u.role = 'admin' OR r.slug = 'admin')`
    )) as any;
    return (rows as any[]).map((r) => r.id);
  } catch (e) {
    console.error('[activity] getAllAdminIds error:', e);
    return [];
  }
}

// ============================================
// Main — log activity + fan out notifications
// ============================================
export async function logActivity(opts: LogActivityOptions): Promise<void> {
  const {
    actor,
    action,
    entityType,
    entityId = null,
    entityName = null,
    changes = null,
    request,
  } = opts;

  const { ip, ua } = extractMeta(request);

  // 1) Write to activity_log
  try {
    await pool.query(
      `INSERT INTO activity_log
       (user_id, user_name, action, entity_type, entity_id, entity_name, changes, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        actor.userId,
        actor.userName,
        action,
        entityType,
        entityId,
        entityName,
        changes ? JSON.stringify(changes) : null,
        ip,
        ua ? ua.slice(0, 500) : null,
      ]
    );
  } catch (e) {
    console.error('[activity] failed to write activity_log:', e);
  }

  // 2) Fan out notifications to admins
  const title = `${ENTITY_LABEL[entityType]} ${ACTION_LABEL[action]}`;
  const message = `${actor.userName} ${ACTION_LABEL[action]} ${
    entityName ? `"${entityName}"` : ENTITY_LABEL[entityType].toLowerCase()
  }`;

  try {
    const recipients = await getAllAdminIds();
    if (recipients.length === 0) return;

    const type = `${entityType}.${action}`;
    const link = ENTITY_LINK[entityType];

    const values = recipients.map((uid) => [
      uid,
      type,
      title,
      message,
      entityType,
      entityId,
      actor.userId,
      actor.userName,
      link,
      false,
    ]);

    await pool.query(
      `INSERT INTO notifications
       (user_id, type, title, message, entity_type, entity_id, actor_id, actor_name, link, is_read)
       VALUES ?`,
      [values]
    );
  } catch (e) {
    console.error('[activity] failed to fan out notifications:', e);
  }
}

// ============================================
// Diff helper
// ============================================
export function diff(
  before: Record<string, any>,
  after: Record<string, any>,
  ignore: string[] = ['password', 'password_hash', 'updated_at', 'created_at']
): Record<string, { from: any; to: any }> {
  const out: Record<string, { from: any; to: any }> = {};
  for (const key of Object.keys(after)) {
    if (ignore.includes(key)) continue;
    const b = before[key];
    const a = after[key];
    if (JSON.stringify(b) !== JSON.stringify(a)) {
      out[key] = { from: b ?? null, to: a ?? null };
    }
  }
  return out;
}