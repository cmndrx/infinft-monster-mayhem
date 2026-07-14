import { authErrorMessage, getPasswordChecks, isValidUsername } from './authFlowValidation'

describe('Golf Galaxy authentication flow parity', () => {
  test('uses the same username constraints', () => {
    expect(isValidUsername('mayhem_player')).toBe(true)
    expect(isValidUsername('ab')).toBe(false)
    expect(isValidUsername('not allowed')).toBe(false)
  })

  test('requires every Golf Galaxy password rule', () => {
    expect(getPasswordChecks('Mayhem#1')).toEqual({
      length: true,
      lowercase: true,
      uppercase: true,
      number: true,
      special: true,
    })
    expect(Object.values(getPasswordChecks('password')).every(Boolean)).toBe(false)
  })

  test('maps Firebase errors to the mirrored user-facing copy', () => {
    expect(authErrorMessage({ code: 'auth/invalid-credential' })).toBe(
      'Login failed. Please check your email and password.'
    )
    expect(authErrorMessage({ code: 'auth/username-already-in-use' })).toBe(
      'That username is already taken. Please choose another one.'
    )
  })
})
