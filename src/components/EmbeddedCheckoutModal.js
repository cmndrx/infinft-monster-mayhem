import { useMemo } from 'react'
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { getStripePublishableKey } from '../services/membership.js'

export default function EmbeddedCheckoutModal({ open, onClose, clientSecret, ariaLabel = 'Membership checkout' }) {
  const publishableKey = getStripePublishableKey()
  const stripePromise = useMemo(() => (publishableKey ? loadStripe(publishableKey) : null), [publishableKey])
  const options = useMemo(() => ({ clientSecret }), [clientSecret])

  if (!open) return null

  return (
    <div className="checkout-modal" role="dialog" aria-modal="true" aria-label={ariaLabel}>
      <div className="checkout-modal__panel">
        <button className="checkout-modal__close" onClick={onClose} type="button" aria-label="Close checkout">
          ×
        </button>

        {!publishableKey ? (
          <div className="checkout-modal__notice">
            Stripe is not configured yet. Add `REACT_APP_STRIPE_PUBLISHABLE_KEY` or the shared test/live publishable key env.
          </div>
        ) : clientSecret && stripePromise ? (
          <div className="checkout-modal__embed">
            <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        ) : null}
      </div>
    </div>
  )
}

