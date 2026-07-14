function authErrorMessage(error) {
  const code = error?.code || error
  switch (code) {
    case 'auth/email-already-in-use':
      return 'That email is already connected to an account.'
    case 'auth/username-already-in-use':
      return 'That username is already taken. Please choose another one.'
    case 'auth/invalid-email':
      return 'Please enter a valid email address.'
    case 'auth/user-disabled':
      return 'This account has been disabled.'
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Login failed. Please check your email and password.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.'
    case 'auth/weak-password':
      return 'Please use a stronger password.'
    default:
      return error?.message || String(error || 'Something went wrong with authentication.')
  }
}

function isValidUsername(value) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(String(value || '').trim())
}

function getPasswordChecks(password = '') {
  return {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }
}

export { authErrorMessage, getPasswordChecks, isValidUsername }
