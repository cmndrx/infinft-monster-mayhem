import {
  getLeaderboardRecoveryPatch,
  hasRecoveryValues,
  mergeProfileWithLeaderboard,
} from './gameProfileRecovery'

describe('game profile recovery', () => {
  const historicalLeaderboard = {
    bestRunSeconds: 975,
    bestKills: 2947,
    totalRuns: 4,
    totalKills: 4314,
    totalWins: 0,
    totalCoinsBanked: 820,
  }

  test('restores a profile that was reset to zero', () => {
    const profile = {
      bestRunSeconds: 0,
      bestKills: 0,
      totalRuns: 0,
      totalKills: 0,
      totalWins: 0,
      totalCoinsBanked: 0,
    }

    expect(mergeProfileWithLeaderboard(profile, historicalLeaderboard)).toEqual(historicalLeaderboard)
  })

  test('never reduces newer profile values', () => {
    const profile = {
      bestRunSeconds: 1200,
      bestKills: 3100,
      totalRuns: 7,
      totalKills: 6000,
      totalWins: 2,
      totalCoinsBanked: 1200,
      coins: 75,
    }

    expect(getLeaderboardRecoveryPatch(profile, historicalLeaderboard)).toEqual({})
    expect(mergeProfileWithLeaderboard(profile, historicalLeaderboard)).toEqual(profile)
  })

  test('fills missing historical fields without touching economy data', () => {
    const profile = { coins: 50, upgrades: { dmg: 2 } }
    const recovered = mergeProfileWithLeaderboard(profile, historicalLeaderboard)

    expect(recovered.coins).toBe(50)
    expect(recovered.upgrades).toEqual({ dmg: 2 })
    expect(recovered.totalKills).toBe(4314)
    expect(hasRecoveryValues(getLeaderboardRecoveryPatch(profile, historicalLeaderboard))).toBe(true)
  })

  test('ignores malformed or negative leaderboard values', () => {
    const patch = getLeaderboardRecoveryPatch(
      { totalRuns: 3 },
      { totalRuns: -2, totalKills: 'not-a-number', bestKills: null }
    )

    expect(patch).toEqual({})
    expect(hasRecoveryValues(patch)).toBe(false)
  })
})
