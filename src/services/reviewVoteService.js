import { apiClient, IS_SUPABASE } from '../config/api'

// ---------------------------------------------------------------------------
// ReviewVoteService — thumbs up / thumbs down on reviews.
//
// Uses the Supabase table public.review_votes (see supabase/fitur_tambahan.sql)
// when it exists. If the table is missing or the server is unreachable, votes
// are kept in localStorage so the feature still works on this device.
//
// Vote values: 1 = thumbs up, -1 = thumbs down, 0 = remove vote.
// ---------------------------------------------------------------------------

const LOCAL_KEY = 'bore_barrel_review_votes'

// Set once the server reports the table does not exist, so we stop asking.
let serverTableMissing = false

const readLocalVotes = () => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

const writeLocalVotes = (votes) => {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(votes))
  } catch {
    /* quota exceeded — silently fail */
  }
}

const isTableMissing = (err) => err?.status === 404 || err?.code === 'PGRST205'

const emptyTally = () => ({ up: 0, down: 0, mine: 0 })

class ReviewVoteService {
  /**
   * Return a map { [reviewId]: { up, down, mine } } for the given reviews.
   */
  async getVotes(reviewIds, userId) {
    const tally = Object.fromEntries(reviewIds.map((id) => [String(id), emptyTally()]))
    if (reviewIds.length === 0) return { source: 'local', votes: tally }

    if (IS_SUPABASE && !serverTableMissing) {
      try {
        const data = await apiClient.get(
          `/rest/v1/review_votes?review_id=in.(${reviewIds.join(',')})&select=review_id,user_id,vote`,
        )
        ;(Array.isArray(data) ? data : []).forEach((row) => {
          const entry = tally[String(row.review_id)]
          if (!entry) return
          if (row.vote > 0) entry.up += 1
          if (row.vote < 0) entry.down += 1
          if (row.user_id === userId) entry.mine = row.vote
        })
        return { source: 'server', votes: tally }
      } catch (err) {
        if (isTableMissing(err)) serverTableMissing = true
      }
    }

    const local = readLocalVotes()
    reviewIds.forEach((id) => {
      const vote = local[String(id)] || 0
      const entry = tally[String(id)]
      if (vote > 0) entry.up = 1
      if (vote < 0) entry.down = 1
      entry.mine = vote
    })
    return { source: 'local', votes: tally }
  }

  /**
   * Cast, change, or remove (value = 0) the current user's vote.
   */
  async vote(reviewId, userId, value) {
    if (IS_SUPABASE && !serverTableMissing) {
      try {
        if (value === 0) {
          await apiClient.delete(
            `/rest/v1/review_votes?review_id=eq.${reviewId}&user_id=eq.${userId}`,
          )
        } else {
          // Upsert on the (review_id, user_id) primary key
          await apiClient.post(
            '/rest/v1/review_votes?on_conflict=review_id,user_id',
            { review_id: Number(reviewId), user_id: userId, vote: value },
            { headers: { Prefer: 'resolution=merge-duplicates,return=minimal' } },
          )
        }
        return { success: true, source: 'server' }
      } catch (err) {
        if (isTableMissing(err)) serverTableMissing = true
      }
    }

    const local = readLocalVotes()
    if (value === 0) delete local[String(reviewId)]
    else local[String(reviewId)] = value
    writeLocalVotes(local)
    return { success: true, source: 'local' }
  }
}

export default new ReviewVoteService()
