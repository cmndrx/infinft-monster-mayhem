export const HISTORICAL_PROGRESS_FIELDS = [
  'bestRunSeconds',
  'bestKills',
  'totalRuns',
  'totalKills',
  'totalWins',
  'totalCoinsBanked',
]

function normalizedProgressNumber(value) {
  if (typeof value !== 'number') return null
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : null
}

export function getLeaderboardRecoveryPatch(profile = {}, leaderboard = {}) {
  return HISTORICAL_PROGRESS_FIELDS.reduce((patch, field) => {
    const profileValue = normalizedProgressNumber(profile?.[field])
    const leaderboardValue = normalizedProgressNumber(leaderboard?.[field])

    if (leaderboardValue !== null && (profileValue === null || leaderboardValue > profileValue)) {
      patch[field] = leaderboardValue
    }

    return patch
  }, {})
}

export function hasRecoveryValues(patch = {}) {
  return HISTORICAL_PROGRESS_FIELDS.some((field) => Number(patch?.[field]) > 0)
}

export function mergeProfileWithLeaderboard(profile = {}, leaderboard = {}) {
  return {
    ...profile,
    ...getLeaderboardRecoveryPatch(profile, leaderboard),
  }
}
