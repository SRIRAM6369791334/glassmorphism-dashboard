export type AuthMode = 'login' | 'register'

export interface LoginValues {
  username: string
  password: string
}

export interface RegisterValues {
  fullName: string
  email: string
  password: string
}

// The screen owns submission behavior. Forms do not know about an API or session.
export interface AuthSubmitHandlers {
  onLogin: (values: LoginValues) => void
  onRegister: (values: RegisterValues) => void
}
