import { defineStore } from 'pinia'
import { api } from '../services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token') || null
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.rol === 'administrador',
    isSupervisor: (state) => ['administrador', 'supervisor'].includes(state.user?.rol),
    isVendedor: (state) => state.user?.rol === 'vendedor'
  },

  actions: {
    async login(email, password) {
      const response = await api.post('/auth/login', { email, password })
      if (response.data.success) {
        this.token = response.data.data.token
        this.user = response.data.data.usuario
        localStorage.setItem('token', this.token)
        localStorage.setItem('user', JSON.stringify(this.user))
        return true
      }
      return false
    },

    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }
})
