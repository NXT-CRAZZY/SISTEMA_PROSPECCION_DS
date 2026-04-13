<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
        <p class="text-gray-500">Administración de vendedores y supervisores</p>
      </div>
      <button @click="showModalNuevo = true" class="btn btn-primary">+ Nuevo Usuario</button>
    </div>

    <div class="card">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="table-header">
              <th class="px-4 py-3 text-left">Nombre</th>
              <th class="px-4 py-3 text-left">Email</th>
              <th class="px-4 py-3 text-left">Rol</th>
              <th class="px-4 py-3 text-left">Estado</th>
              <th class="px-4 py-3 text-left">Fecha Registro</th>
              <th class="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in usuarios" :key="u.id" class="table-row">
              <td class="px-4 py-3 font-medium">{{ u.nombre }}</td>
              <td class="px-4 py-3 text-gray-600">{{ u.email }}</td>
              <td class="px-4 py-3">
                <span :class="getRolClass(u.rol)" class="badge">{{ u.rol }}</span>
              </td>
              <td class="px-4 py-3">
                <span :class="u.activo ? 'badge-success' : 'badge-danger'" class="badge">
                  {{ u.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-500">{{ formatDate(u.creado_en) }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-center gap-2">
                  <button @click="toggleActivo(u)" class="p-2 hover:bg-gray-100 rounded-lg" :title="u.activo ? 'Desactivar' : 'Activar'">
                    <svg v-if="u.activo" class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    <svg v-else class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="showModalNuevo" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div class="p-6 border-b border-gray-100">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold text-gray-900">Nuevo Usuario</h2>
            <button @click="showModalNuevo = false" class="p-2 hover:bg-gray-100 rounded-lg">
              <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form @submit.prevent="crearUsuario" class="p-6 space-y-4">
          <div>
            <label class="label">Nombre *</label>
            <input v-model="nuevoUsuario.nombre" type="text" class="input" required />
          </div>
          <div>
            <label class="label">Email *</label>
            <input v-model="nuevoUsuario.email" type="email" class="input" required />
          </div>
          <div>
            <label class="label">Contraseña *</label>
            <input v-model="nuevoUsuario.password" type="password" class="input" required />
          </div>
          <div>
            <label class="label">Rol *</label>
            <select v-model="nuevoUsuario.rol" class="input" required>
              <option value="vendedor">Vendedor</option>
              <option value="supervisor">Supervisor</option>
              <option value="administrador">Administrador</option>
            </select>
          </div>

          <div v-if="error" class="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{{ error }}</div>

          <div class="flex justify-end gap-3 pt-4">
            <button type="button" @click="showModalNuevo = false" class="btn btn-secondary">Cancelar</button>
            <button type="submit" class="btn btn-primary" :disabled="loading">Crear</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../services/api'

const usuarios = ref([])
const showModalNuevo = ref(false)
const loading = ref(false)
const error = ref('')

const nuevoUsuario = ref({
  nombre: '',
  email: '',
  password: '',
  rol: 'vendedor'
})

async function cargarUsuarios() {
  try {
    const response = await api.get('/usuarios')
    usuarios.value = response.data.data
  } catch (error) {
    console.error('Error:', error)
  }
}

async function crearUsuario() {
  error.value = ''
  loading.value = true

  try {
    await api.post('/usuarios', nuevoUsuario.value)
    showModalNuevo.value = false
    nuevoUsuario.value = { nombre: '', email: '', password: '', rol: 'vendedor' }
    cargarUsuarios()
  } catch (e) {
    error.value = e.response?.data?.message || 'Error al crear usuario'
  } finally {
    loading.value = false
  }
}

async function toggleActivo(usuario) {
  try {
    await api.patch(`/usuarios/${usuario.id}/toggle`, { activo: !usuario.activo })
    cargarUsuarios()
  } catch (error) {
    console.error('Error:', error)
  }
}

function getRolClass(rol) {
  const classes = {
    administrador: 'badge-danger',
    supervisor: 'badge-warning',
    vendedor: 'badge-info'
  }
  return classes[rol] || 'badge-gray'
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('es-PE')
}

onMounted(cargarUsuarios)
</script>
