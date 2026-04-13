<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800">
    <div class="card p-8 w-full max-w-md">
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-900">CRM Ventas</h1>
        <p class="text-gray-500 mt-1">Sistema de Rastreo de Ventas</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="label">Correo electrónico</label>
          <input 
            v-model="email" 
            type="email" 
            class="input" 
            placeholder="correo@ejemplo.com"
            required
          />
        </div>

        <div>
          <label class="label">Contraseña</label>
          <input 
            v-model="password" 
            type="password" 
            class="input" 
            placeholder="••••••••"
            required
          />
        </div>

        <div v-if="error" class="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          {{ error }}
        </div>

        <button 
          type="submit" 
          class="btn btn-primary w-full"
          :disabled="loading"
        >
          <span v-if="loading">Iniciando sesión...</span>
          <span v-else>Iniciar Sesión</span>
        </button>
      </form>

      <div class="mt-6 pt-6 border-t border-gray-100">
        <p class="text-center text-sm text-gray-500 mb-3">Credenciales de prueba</p>
        <div class="grid grid-cols-2 gap-2 text-xs text-gray-600">
          <div class="bg-gray-50 p-2 rounded">
            <p class="font-medium">Admin</p>
            <p>admin@crm.com</p>
          </div>
          <div class="bg-gray-50 p-2 rounded">
            <p class="font-medium">Vendedor</p>
            <p>maria@crm.com</p>
          </div>
        </div>
        <p class="text-center text-xs text-gray-400 mt-2">Contraseña: password123</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true

  try {
    const success = await authStore.login(email.value, password.value)
    if (success) {
      router.push('/')
    } else {
      error.value = 'Credenciales incorrectas'
    }
  } catch (e) {
    error.value = e.response?.data?.message || 'Error al iniciar sesión'
  } finally {
    loading.value = false
  }
}
</script>
