import { useEffect, useMemo, useState } from 'react'
import {
  createMembershipCheckout,
  formatMembershipPrice,
  getPlayerPlanCatalog,
  getRecommendedPlayerPlan,
  getTierComparisonItems,
  MEMBERSHIP_PLAN_FAMILIES,
  saveMembershipPreference,
} from '../services/membership.js'
import EmbeddedCheckoutModal from './EmbeddedCheckoutModal.js'
import studioLogo from '../assets/logo-icon-reg-blkBorder.png'
import './AuthFlow.css'
import { authErrorMessage, getPasswordChecks, isValidUsername } from './authFlowValidation'

const FREE_PLAN_KEY = 'free'

const EMPTY_FORM = {
  username: '',
  email: '',
  password: '',
}

export default function AuthFlow({ initialMode = 'login', authError = null, signIn, signUp, resetPassword, onClose }) {
  const [activeTab, setActiveTab] = useState(initialMode)
  const [form, setForm] = useState(EMPTY_FORM)
  const [feedback, setFeedback] = useState(null)
  const [busy, setBusy] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [step, setStep] = useState('choose')
  const [planTab, setPlanTab] = useState(FREE_PLAN_KEY)
  const [planCatalog, setPlanCatalog] = useState([])
  const [plansLoading, setPlansLoading] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutClientSecret, setCheckoutClientSecret] = useState('')
  const [finishing, setFinishing] = useState(false)
  const [planSummaryExpanded, setPlanSummaryExpanded] = useState(false)

  const isCreateAccount = activeTab === 'signup'
  const selectedPlan = useMemo(
    () => planCatalog.find((plan) => plan.planId === selectedPlanId) || null,
    [planCatalog, selectedPlanId],
  )
  const recommendedPlan = useMemo(() => getRecommendedPlayerPlan(), [])
  const passwordChecks = useMemo(
    () => getPasswordChecks(form.password),
    [form.password],
  )
  const canLogin = form.email.trim().length > 0 && form.password.trim().length > 0 && !busy
  const canSignup =
    isValidUsername(form.username) &&
    form.email.trim().length > 0 &&
    Object.values(passwordChecks).every(Boolean) &&
    !busy

  useEffect(() => {
    let active = true

    async function loadPlans() {
      setPlansLoading(true)
      try {
        const plans = await getPlayerPlanCatalog()
        if (active) setPlanCatalog(plans)
      } catch (error) {
        if (active) setFeedback({ type: 'error', message: error?.message || 'We could not load player plans yet.' })
      } finally {
        if (active) setPlansLoading(false)
      }
    }

    loadPlans()

    return () => {
      active = false
    }
  }, [])

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  const choosePlan = async (plan) => {
    setSelectedPlanId(plan.planId)
    setPlanTab(MEMBERSHIP_PLAN_FAMILIES.PLAYER)
    setPlanSummaryExpanded(false)
    setFeedback(null)
    await saveMembershipPreference({ preference: MEMBERSHIP_PLAN_FAMILIES.PLAYER })
    setStep('auth')
  }

  const openCheckout = async (user) => {
    if (!selectedPlan || !user?.uid) return

    setFinishing(true)
    setStep('finish')
    setFeedback(null)
    try {
      await saveMembershipPreference({ userId: user.uid, preference: MEMBERSHIP_PLAN_FAMILIES.PLAYER })
      const checkoutPayload = await createMembershipCheckout({
        planId: selectedPlan.planId,
        userId: user.uid,
        successPath: '/membership?for=player&checkout=complete',
        cancelPath: '/membership?for=player',
      })
      setCheckoutClientSecret(checkoutPayload.clientSecret)
      setCheckoutOpen(true)
    } catch (error) {
      setFeedback({ type: 'error', message: error?.message || 'We could not start membership checkout yet.' })
      setStep('auth')
    } finally {
      setFinishing(false)
    }
  }

  const submit = async (event) => {
    event.preventDefault()
    if (isCreateAccount ? !canSignup : !canLogin) return

    setBusy(true)
    setFeedback(null)
    try {
      if (isCreateAccount) {
        const result = await signUp(form)
        setFeedback({ type: 'success', message: 'Account created successfully.' })
        setForm(EMPTY_FORM)
        if (selectedPlan) {
          await openCheckout(result?.user)
        }
      } else {
        const user = await signIn(form.email, form.password)
        setFeedback({ type: 'success', message: 'You are now logged in.' })
        setForm((current) => ({ ...current, password: '' }))
        if (selectedPlan) await openCheckout(user)
      }
    } catch (error) {
      setFeedback({ type: 'error', message: authErrorMessage(error) })
    } finally {
      setBusy(false)
    }
  }

  const submitReset = async () => {
    const email = resetEmail.trim() || form.email.trim()
    if (!email) {
      setFeedback({ type: 'error', message: 'Enter your email first, then request a password reset.' })
      return
    }

    setBusy(true)
    setFeedback(null)
    try {
      await resetPassword(email)
      setResetOpen(false)
      setResetEmail('')
      setFeedback({ type: 'success', message: 'Password reset email sent. Please check your inbox.' })
    } catch (error) {
      setFeedback({ type: 'error', message: authErrorMessage(error) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="subscription-modal golf-auth-modal" role="dialog" aria-modal="true" aria-label="Monster Mayhem authentication">
      <div className="subscription-modal__panel">
        <div className="subscription-modal__corner">
          <button
            className={`subscription-modal__auth-link${activeTab === 'login' ? ' is-active' : ''}`}
            onClick={() => {
              setActiveTab('login')
              setStep('choose')
              setPlanTab(FREE_PLAN_KEY)
              setSelectedPlanId('')
              setFeedback(null)
            }}
            type="button"
          >
            Sign In
          </button>
          <button
            className={`subscription-modal__auth-link${activeTab === 'signup' ? ' is-active' : ''}`}
            onClick={() => {
              setActiveTab('signup')
              setStep('choose')
              setPlanTab(FREE_PLAN_KEY)
              setSelectedPlanId('')
              setFeedback(null)
            }}
            type="button"
          >
            Create Account
          </button>
          {onClose ? (
            <button
              aria-label="Close authentication"
              className="subscription-modal__close"
              onClick={() => {
                setActiveTab('login')
                setStep('choose')
                setPlanTab(FREE_PLAN_KEY)
                setSelectedPlanId('')
                setFeedback(null)
                onClose()
              }}
              type="button"
            >
              ×
            </button>
          ) : null}
        </div>

        <div className="subscription-modal__content">
          <header className="subscription-modal__header">
            <span className="subscription-modal__eyebrow">
              {isCreateAccount ? 'Infinft Studios Membership' : 'Infinft Studios'}
            </span>
            <h2>
              {isCreateAccount
                ? step === 'choose'
                  ? 'Choose your path.'
                  : step === 'auth'
                    ? 'Create your account.'
                    : 'Finishing your setup.'
                : 'Welcome back.'}
            </h2>
            <p>
              {isCreateAccount
                ? step === 'choose'
                  ? 'Start free or pick a paid lane - you can upgrade anytime.'
                  : step === 'auth'
                    ? `You picked ${selectedPlan?.displayName || 'a player plan'}. Create your account to continue to checkout.`
                    : `We are getting ${selectedPlan?.displayName || 'your player plan'} ready for checkout.`
                : 'Sign in to continue into Monster Mayhem.'}
            </p>
          </header>

          {isCreateAccount ? (
            <div className="subscription-modal__steps" aria-label="Join now steps">
              {[
                { key: 'choose', label: 'Choose a plan' },
                { key: 'auth', label: 'Create account' },
                { key: 'finish', label: 'Finish' },
              ].map((item, index) => {
                const activeIndex = ['choose', 'auth', 'finish'].indexOf(step)
                const stateClass = index < activeIndex ? 'is-complete' : index === activeIndex ? 'is-active' : ''

                return (
                  <div className={`subscription-modal__step ${stateClass}`.trim()} key={item.key}>
                    <span>{index + 1}</span>
                    <small>{item.label}</small>
                  </div>
                )
              })}
            </div>
          ) : null}

          {isCreateAccount && step === 'choose' ? (
            <div className="subscription-modal__body">
              <div className="subscription-modal__lane-switch" role="tablist" aria-label="Membership lanes">
                <button
                  type="button"
                  role="tab"
                  aria-selected={planTab === FREE_PLAN_KEY}
                  className={`subscription-modal__lane-switch-option${planTab === FREE_PLAN_KEY ? ' is-active' : ''}`}
                  onClick={() => {
                    setPlanTab(FREE_PLAN_KEY)
                    setSelectedPlanId('')
                  }}
                >
                  <span aria-hidden="true">+</span>
                  <span>Free</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={planTab === MEMBERSHIP_PLAN_FAMILIES.PLAYER}
                  className={`subscription-modal__lane-switch-option${planTab === MEMBERSHIP_PLAN_FAMILIES.PLAYER ? ' is-active' : ''}`}
                  onClick={() => setPlanTab(MEMBERSHIP_PLAN_FAMILIES.PLAYER)}
                >
                  <span aria-hidden="true">&gt;</span>
                  <span>Player</span>
                </button>
              </div>

              {planTab === FREE_PLAN_KEY ? (
                <div className="subscription-modal__free">
                  <div className="subscription-modal__auth-card">
                    <div className="subscription-modal__free-copy">
                      <strong>Create your free account</strong>
                    </div>

                    <div className="subscription-modal__auth-form">
                      <form className="auth-form auth-form--stage auth-form--compact" onSubmit={submit}>
                        {feedback ? <p className={`auth-form__alert ${feedback.type}`}>{feedback.message}</p> : null}
                        {!feedback && authError ? <p className="auth-form__alert error">{authErrorMessage(authError)}</p> : null}

                        <label className="auth-field">
                          <span>Username</span>
                          <input
                            autoComplete="username"
                            onChange={updateField('username')}
                            placeholder="Username"
                            value={form.username}
                          />
                          <small>3-20 chars. Letters, numbers, and underscores only.</small>
                        </label>

                        <label className="auth-field">
                          <span>Email</span>
                          <input
                            autoComplete="email"
                            onChange={updateField('email')}
                            placeholder="Email"
                            type="email"
                            value={form.email}
                          />
                        </label>

                        <label className="auth-field">
                          <span>Password</span>
                          <input
                            autoComplete="new-password"
                            onChange={updateField('password')}
                            placeholder="Password"
                            type="password"
                            value={form.password}
                          />
                        </label>

                        <div className="auth-password-rules auth-password-rules--stage is-compact" aria-label="Password requirements">
                          <span className={passwordChecks.length ? 'is-valid' : 'is-invalid'}>8+ chars</span>
                          <span className={passwordChecks.lowercase ? 'is-valid' : 'is-invalid'}>1 lowercase</span>
                          <span className={passwordChecks.uppercase ? 'is-valid' : 'is-invalid'}>1 uppercase</span>
                          <span className={passwordChecks.number ? 'is-valid' : 'is-invalid'}>1 number</span>
                          <span className={passwordChecks.special ? 'is-valid' : 'is-invalid'}>1 special</span>
                        </div>

                        <button className="auth-form__submit" disabled={!canSignup} type="submit">
                          {busy ? 'Creating...' : 'Create Free Account'}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="subscription-modal__paid-header">
                    <strong className="subscription-modal__paid-prompt">Choose a player tier to continue</strong>
                  </div>
                  <div className="subscription-modal__lane-tiers">
                    {planCatalog.map((plan) => {
                      const isSelected = selectedPlanId === plan.planId
                      const isFeatured = plan.planId === recommendedPlan?.planId || plan.featured

                      return (
                        <div className={`subscription-modal__tier${isSelected ? ' is-selected' : ''}`} key={plan.planId}>
                          <div className="subscription-modal__tier-head">
                            <div>
                              <span className="subscription-modal__plan-badge">{plan.badge || 'Tier'}</span>
                              <h4>{plan.displayName}</h4>
                            </div>
                            <div className="subscription-modal__tier-price">
                              <strong>{formatMembershipPrice(plan.priceCents)}</strong>
                              <span>/ month</span>
                            </div>
                          </div>
                          <p>{plan.ctaCopy}</p>
                          <ul>
                            {getTierComparisonItems(plan).map((item) => (
                              <li key={item}>
                                <span className="subscription-modal__perk-mark" aria-hidden="true">✓</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                          <button
                            className={`subscription-modal__cta${isFeatured ? ' is-featured' : ''}`}
                            onClick={() => choosePlan(plan)}
                            type="button"
                          >
                            Choose {plan.displayName}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          ) : null}

          {isCreateAccount && step === 'auth' ? (
            <div className="subscription-modal__auth">
              <div className={`subscription-modal__auth-summary${planSummaryExpanded ? ' is-expanded' : ''}`}>
                <button
                  className="subscription-modal__auth-summary-toggle"
                  type="button"
                  onClick={() => setPlanSummaryExpanded((currentValue) => !currentValue)}
                  aria-expanded={planSummaryExpanded}
                >
                  <span className="subscription-modal__auth-summary-copy">
                    <span className="subscription-modal__plan-badge">Selected plan</span>
                    <strong>{selectedPlan?.displayName || 'Player plan'}</strong>
                    <p>{`Player lane - ${formatMembershipPrice(selectedPlan?.priceCents || 0)} / month after account setup.`}</p>
                  </span>
                  <span className="subscription-modal__auth-summary-icon">
                    {planSummaryExpanded ? '⌃' : '⌄'}
                  </span>
                </button>

                {planSummaryExpanded && selectedPlan ? (
                  <div className="subscription-modal__auth-summary-details">
                    {getTierComparisonItems(selectedPlan).map((item) => (
                      <div className="subscription-modal__auth-summary-perk" key={item}>
                        <span className="subscription-modal__perk-mark" aria-hidden="true">✓</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="subscription-modal__auth-card">
                <div className="subscription-modal__free-copy">
                  <strong>Create your account</strong>
                </div>

                <div className="subscription-modal__auth-form">
                  <form className="auth-form auth-form--stage" onSubmit={submit}>
                    {feedback ? <p className={`auth-form__alert ${feedback.type}`}>{feedback.message}</p> : null}
                    {!feedback && authError ? <p className="auth-form__alert error">{authErrorMessage(authError)}</p> : null}

                    <label className="auth-field">
                      <span>Username</span>
                      <input
                        autoComplete="username"
                        onChange={updateField('username')}
                        placeholder="Username"
                        value={form.username}
                      />
                      <small>3-20 chars. Letters, numbers, and underscores only.</small>
                    </label>

                    <label className="auth-field">
                      <span>Email</span>
                      <input
                        autoComplete="email"
                        onChange={updateField('email')}
                        placeholder="Email"
                        type="email"
                        value={form.email}
                      />
                    </label>

                    <label className="auth-field">
                      <span>Password</span>
                      <input
                        autoComplete="new-password"
                        onChange={updateField('password')}
                        placeholder="Password"
                        type="password"
                        value={form.password}
                      />
                    </label>

                    <div className="auth-password-rules auth-password-rules--stage is-compact" aria-label="Password requirements">
                      <span className={passwordChecks.length ? 'is-valid' : 'is-invalid'}>8+ chars</span>
                      <span className={passwordChecks.lowercase ? 'is-valid' : 'is-invalid'}>1 lowercase</span>
                      <span className={passwordChecks.uppercase ? 'is-valid' : 'is-invalid'}>1 uppercase</span>
                      <span className={passwordChecks.number ? 'is-valid' : 'is-invalid'}>1 number</span>
                      <span className={passwordChecks.special ? 'is-valid' : 'is-invalid'}>1 special</span>
                    </div>

                    <button className="auth-form__submit" disabled={!canSignup} type="submit">
                      {busy ? 'Creating...' : 'Create Account and Continue'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ) : null}

          {isCreateAccount && step === 'finish' ? (
            <div className="subscription-modal__finish">
              <div className="subscription-modal__finish-mark">{finishing ? '...' : '›'}</div>
              <strong>{selectedPlan?.displayName || 'Player plan'}</strong>
              <p>
                {checkoutOpen
                  ? 'Checkout is open. Complete your subscription, or close checkout to pick a different plan.'
                  : 'We are preparing your membership checkout.'}
              </p>

              {!finishing ? (
                <button
                  className="subscription-modal__cta"
                onClick={() => {
                  setStep('choose')
                  setPlanTab(MEMBERSHIP_PLAN_FAMILIES.PLAYER)
                  setCheckoutOpen(false)
                  setCheckoutClientSecret('')
                }}
                  type="button"
                >
                  Back to plans
                </button>
              ) : null}
            </div>
          ) : null}

          {!isCreateAccount ? (
          <div className="subscription-modal__signin">
            <div className="subscription-modal__auth-card">
              <div className="subscription-modal__free-copy">
                <strong>Sign in to your account</strong>
              </div>

              <div className="subscription-modal__auth-form">
                <form className="auth-form auth-form--stage" onSubmit={submit}>
                  {feedback ? <p className={`auth-form__alert ${feedback.type}`}>{feedback.message}</p> : null}
                  {!feedback && authError ? <p className="auth-form__alert error">{authErrorMessage(authError)}</p> : null}

                  <label className="auth-field">
                    <span>Email</span>
                    <input
                      autoComplete="email"
                      onChange={updateField('email')}
                      placeholder="Email"
                      type="email"
                      value={form.email}
                    />
                  </label>

                  <label className="auth-field">
                    <span>Password</span>
                    <input
                      autoComplete={isCreateAccount ? 'new-password' : 'current-password'}
                      onChange={updateField('password')}
                      placeholder="Password"
                      type="password"
                      value={form.password}
                    />
                  </label>

                  <button className="auth-form__submit" disabled={!canLogin} type="submit">
                    {busy ? 'Signing in...' : selectedPlan ? 'Sign In and Continue' : 'Sign In'}
                  </button>

                  <p className="auth-form__switch">
                    Forgot password?{' '}
                    <button className="auth-form__link" onClick={() => setResetOpen(true)} type="button">
                      Reset it
                    </button>
                  </p>
                </form>
              </div>
            </div>
          </div>
          ) : null}

          {!isCreateAccount ? (
            <footer className="subscription-modal__footer">
              <button
                className="subscription-modal__dismiss"
                onClick={() => {
                  setActiveTab('signup')
                  setStep('choose')
                  setPlanTab(FREE_PLAN_KEY)
                  setSelectedPlanId('')
                  setFeedback(null)
                }}
                type="button"
              >
                Need an account? Create one
              </button>
            </footer>
          ) : null}
          {plansLoading ? <div className="subscription-modal__loading">Refreshing live player plans...</div> : null}
        </div>

        <div className="auth-page__support">
          <a
            className="auth-page__powered"
            href="https://infinftstudios.com"
            rel="noopener noreferrer"
            target="_blank"
          >
            <span>Powered by</span>
            <img className="auth-page__powered-logo" src={studioLogo} alt="Infinft Studios logo" />
            <span>Infinft Studios</span>
          </a>
        </div>
      </div>

      {resetOpen ? (
        <div className="auth-reset-modal" role="presentation" onMouseDown={() => setResetOpen(false)}>
          <section className="auth-reset-modal__card" onMouseDown={(event) => event.stopPropagation()}>
            <p className="auth-card__badge auth-card__badge--modal">Account Help</p>
            <h2 className="auth-reset-modal__title">Reset Password</h2>
            <p className="auth-reset-modal__copy">
              We&apos;ll send a reset link to the email entered on the login form.
            </p>
            <label className="auth-field">
              <span>Email</span>
              <input
                autoComplete="email"
                onChange={(event) => setResetEmail(event.target.value)}
                placeholder={form.email || 'pilot@infinft.com'}
                type="email"
                value={resetEmail}
              />
            </label>
            <button className="auth-form__submit" disabled={busy} onClick={submitReset} type="button">
              {busy ? 'Sending...' : 'Send Reset Email'}
            </button>
          </section>
        </div>
      ) : null}
      <EmbeddedCheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        clientSecret={checkoutClientSecret}
      />
    </div>
  )
}
