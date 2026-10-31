import { apiClient, IS_SUPABASE } from '../config/api'
import gunService, { normalizeProduct } from './gunService'

// ---------------------------------------------------------------------------
// ArchiveService — soft delete for products.
//
// "Deleting" a product from the catalog only archives it:
//   • Server: sets products.deleted_at (column added by supabase/fitur_tambahan.sql)
//   • Fallback: when the column does not exist, the server is unreachable or
//     the product is local-only, a snapshot is stored in localStorage.
//
// Archived products are hidden from the catalog and favourites, and can be
// restored or permanently deleted from Profile › Archive.
// ---------------------------------------------------------------------------

const LOCAL_KEY = 'bore_barrel_archive'

const isLocalId = (id) => String(id).startsWith('local-')

// Set once the server reports products.deleted_at does not exist, so we
// stop sending requests that are bound to fail.
let serverColumnMissing = false

const isColumnMissing = (err) =>
  err?.status === 400 && ['42703', 'PGRST204'].includes(err?.code)

const canUseServer = (id) => IS_SUPABASE && !serverColumnMissing && (id == null || !isLocalId(id))

const readLocalArchive = () => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const writeLocalArchive = (entries) => {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(entries))
  } catch {
    /* quota exceeded — silently fail */
  }
}

const removeLocalEntry = (id) => {
  writeLocalArchive(readLocalArchive().filter((e) => String(e.id) !== String(id)))
}

class ArchiveService {
  /**
   * Fetch every archived product (server + local), newest first.
   */
  async getArchived() {
    let serverItems = []

    if (canUseServer()) {
      try {
        const data = await apiClient.get(
          '/rest/v1/products?deleted_at=not.is.null&select=*&order=deleted_at.desc',
        )
        serverItems = (Array.isArray(data) ? data : []).map((p) => ({
          ...normalizeProduct(p),
          archivedAt: p.deleted_at,
          archiveSource: 'server',
        }))
      } catch (err) {
        // column missing or offline — local archive only
        if (isColumnMissing(err)) serverColumnMissing = true
      }
    }

    const seen = new Set(serverItems.map((g) => String(g.id)))
    const localItems = readLocalArchive()
      .filter((e) => !seen.has(String(e.id)))
      .map((e) => ({ ...e.gun, id: e.id, archivedAt: e.archivedAt, archiveSource: 'local' }))

    return [...serverItems, ...localItems].sort(
      (a, b) => new Date(b.archivedAt) - new Date(a.archivedAt),
    )
  }

  /**
   * Soft delete — move a product into the archive.
   */
  async archiveGun(gun) {
    const archivedAt = new Date().toISOString()

    if (canUseServer(gun.id)) {
      try {
        const res = await apiClient.patch(
          `/rest/v1/products?id=eq.${gun.id}`,
          { deleted_at: archivedAt },
          { headers: { Prefer: 'return=representation' } },
        )
        // An empty result means RLS silently blocked the update.
        if (Array.isArray(res) && res.length > 0) {
          return { success: true, source: 'server' }
        }
      } catch (err) {
        // fall through to local archive
        if (isColumnMissing(err)) serverColumnMissing = true
      }
    }

    const entries = readLocalArchive().filter((e) => String(e.id) !== String(gun.id))
    entries.push({ id: gun.id, gun, archivedAt })
    writeLocalArchive(entries)
    return { success: true, source: 'local' }
  }

  /**
   * Restore an archived product back into the catalog.
   */
  async restoreGun(gun) {
    if (gun.archiveSource === 'server') {
      await apiClient.patch(`/rest/v1/products?id=eq.${gun.id}`, { deleted_at: null })
    }
    removeLocalEntry(gun.id)
    return { success: true }
  }

  /**
   * Hard delete — remove the product permanently.
   */
  async purgeGun(gun) {
    if (!isLocalId(gun.id)) {
      await gunService.deleteGun(gun.id)
    }
    removeLocalEntry(gun.id)
    return { success: true }
  }
}

export default new ArchiveService()
