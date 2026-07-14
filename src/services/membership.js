import { auth, db } from '../config/firbaseConfig'

export const MEMBERSHIP_PLAN_FAMILIES = Object.freeze({
  PLAYER: 'player',
  CREATOR: 'creator',
})

const MEMBERSHIP_PREFERENCE_STORAGE_KEY = 'infinft.membershipPreference'

const PLAYER_PLANS = Object.freeze([
  {
    planId: 'player-starter',
    stripeProductId: 'prod_UqWglZA0H4qLY8',
    stripePriceId: 'price_1Tqpd3JOpsxdxVe2JhEsmWIR',
    planType: 'player',
    planFamily: MEMBERSHIP_PLAN_FAMILIES.PLAYER,
    tierKey: 'starter',
    tierRank: 1,
    billingInterval: 'month',
    priceCents: 999,
    aiCreditsRecurring: 0,
    infinityTokensRecurring: 1250,
    gameBuildsRecurring: 0,
    perkFlags: ['cross_title_currency', 'game_access'],
    status: 'active',
    displayName: 'Player Starter',
    badge: 'Play',
    featured: false,
    ctaCopy: 'Enter the token economy',
  },
  {
    planId: 'player-plus',
    stripeProductId: 'prod_UqWhpvghIWBF7A',
    stripePriceId: 'price_1TqpdpJOpsxdxVe283451hWN',
    planType: 'player',
    planFamily: MEMBERSHIP_PLAN_FAMILIES.PLAYER,
    tierKey: 'plus',
    tierRank: 2,
    billingInterval: 'month',
    priceCents: 1499,
    aiCreditsRecurring: 0,
    infinityTokensRecurring: 2500,
    gameBuildsRecurring: 0,
    perkFlags: ['cross_title_currency', 'game_access', 'priority_player_perks', 'battle_wallet_eth_preview'],
    status: 'active',
    displayName: 'Player Plus',
    badge: 'Most Popular',
    featured: true,
    ctaCopy: 'Play with more monthly value',
  },
  {
    planId: 'player-elite',
    stripeProductId: 'prod_UqWhaoRPzRUvMR',
    stripePriceId: 'price_1TqpeWJOpsxdxVe2rwm1xJFF',
    planType: 'player',
    planFamily: MEMBERSHIP_PLAN_FAMILIES.PLAYER,
    tierKey: 'elite',
    tierRank: 3,
    billingInterval: 'month',
    priceCents: 1999,
    aiCreditsRecurring: 0,
    infinityTokensRecurring: 4000,
    gameBuildsRecurring: 0,
    perkFlags: [
      'cross_title_currency',
      'game_access',
      'priority_player_perks',
      'battle_wallet_eth_preview',
      'elite_player_status',
    ],
    status: 'active',
    displayName: 'Player Elite',
    badge: 'High Roller',
    featured: false,
    ctaCopy: 'Max out the player lane',
  },
])

function readEnv(...keys) {
  for (const key of keys) {
    const value = process.env[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

function membershipApiBaseUrl() {
  return (
    readEnv('VITE_MEMBERSHIP_API_BASE_URL', 'VITE_AI_LABS_API_BASE_URL', 'REACT_APP_AI_LABS_API_BASE_URL') ||
    'https://us-central1-infinft-card-game.cloudfunctions.net/aiLabsApi'
  ).replace(/\/+$/, '')
}

async function parseJsonResponse(response) {
  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    const error = new Error(payload?.error || payload?.message || `Request failed with status ${response.status}`)
    error.status = response.status
    error.payload = payload
    throw error
  }

  return payload
}

async function authorizedRequest(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  const user = auth.currentUser

  if (user) {
    const idToken = await user.getIdToken()
    if (idToken) headers.Authorization = `Bearer ${idToken}`
  }

  const response = await fetch(`${membershipApiBaseUrl()}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  return parseJsonResponse(response)
}

function defaultReturnUrl() {
  if (typeof window === 'undefined') return 'https://infinftstudios.com'
  return window.location.origin
}

export function buildDefaultPlayerPlanCatalog() {
  return PLAYER_PLANS.map((plan) => ({ ...plan }))
}

export function getRecommendedPlayerPlan() {
  return buildDefaultPlayerPlanCatalog().find((plan) => plan.planId === 'player-plus') || null
}

export function formatMembershipPrice(priceCents = 0) {
  return `$${(Number(priceCents || 0) / 100).toFixed(2)}`
}

export function getTierComparisonItems(plan) {
  const items = []
  if (Number(plan?.infinityTokensRecurring || 0) > 0) {
    items.push(`${Number(plan.infinityTokensRecurring).toLocaleString()} Infinity Tokens / month`)
  }
  if (Number(plan?.aiCreditsRecurring || 0) > 0) {
    items.push(`${Number(plan.aiCreditsRecurring).toLocaleString()} AI credits / month`)
  }
  if (Number(plan?.gameBuildsRecurring || 0) > 0) {
    items.push(`${Number(plan.gameBuildsRecurring)} game build${Number(plan.gameBuildsRecurring) === 1 ? '' : 's'} / month`)
  }
  return items
}

export async function getPlayerPlanCatalog() {
  try {
    const payload = await authorizedRequest('/membership/plans')
    const plans = Array.isArray(payload?.plans) ? payload.plans : []
    const playerPlans = plans
      .filter((plan) => plan.planFamily === MEMBERSHIP_PLAN_FAMILIES.PLAYER)
      .sort((leftValue, rightValue) => Number(leftValue.tierRank || 0) - Number(rightValue.tierRank || 0))

    return playerPlans.length ? playerPlans : buildDefaultPlayerPlanCatalog()
  } catch {
    return buildDefaultPlayerPlanCatalog()
  }
}

export async function saveMembershipPreference({ userId, preference = MEMBERSHIP_PLAN_FAMILIES.PLAYER }) {
  const normalizedPreference = String(preference || '').trim().toLowerCase()
  if (normalizedPreference !== MEMBERSHIP_PLAN_FAMILIES.PLAYER) return ''

  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(MEMBERSHIP_PREFERENCE_STORAGE_KEY, normalizedPreference)
  }

  if (userId) {
    await db.collection('users').doc(userId).set({ membershipPreference: normalizedPreference }, { merge: true })
  }

  return normalizedPreference
}

export async function createMembershipCheckout({
  planId,
  userId,
  successPath = '/membership?checkout=complete',
  cancelPath = '/membership',
}) {
  if (!userId) throw new Error('user_id_missing')
  if (!planId) throw new Error('plan_id_missing')

  const plan = buildDefaultPlayerPlanCatalog().find((entry) => entry.planId === planId)
  const response = await authorizedRequest('/membership/checkout', {
    method: 'POST',
    body: {
      customerID: userId,
      planId,
      stripePriceId: plan?.stripePriceId || '',
      stripeProductId: plan?.stripeProductId || '',
      source: 'membership',
      successUrl: `${defaultReturnUrl()}${successPath}`,
      cancelUrl: `${defaultReturnUrl()}${cancelPath}`,
    },
  })

  if (!response?.clientSecret) throw new Error('checkout_client_secret_missing')
  return response
}

export function getStripePublishableKey() {
  const isLocalhost =
    typeof window !== 'undefined' && Boolean(window.location?.origin?.includes('localhost'))

  return (
    readEnv('VITE_STRIPE_PUBLISHABLE_KEY', 'REACT_APP_STRIPE_PUBLISHABLE_KEY') ||
    (isLocalhost ? readEnv('VITE_STRIPE_TEST_KEY2', 'REACT_APP_STRIPE_TEST_KEY2') : '') ||
    readEnv('VITE_STRIPE_LIVE_KEY', 'REACT_APP_STRIPE_LIVE_KEY') ||
    readEnv('VITE_STRIPE_TEST_KEY2', 'REACT_APP_STRIPE_TEST_KEY2')
  )
}

