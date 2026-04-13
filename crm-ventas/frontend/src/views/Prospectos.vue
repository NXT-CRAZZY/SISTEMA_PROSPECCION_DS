<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Prospectos</h1>
        <p class="text-gray-500">Gestión de oportunidades de venta</p>
      </div>
      <button @click="showModalNuevo = true" class="btn btn-primary flex items-center gap-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Nuevo Prospecto
      </button>
    </div>

    <div class="card mb-6">
      <div class="p-4 border-b border-gray-100">
        <div class="flex flex-wrap gap-4">
          <div class="flex-1 min-w-[200px]">
            <input v-model="filtros.busqueda" type="text" class="input" placeholder="Buscar por nombre, empresa o RUC..." />
          </div>
          <select v-model="filtros.estado" class="input w-48">
            <option value="">Todos los estados</option>
            <option v-for="e in catalogos.estadosProspecto" :key="e.id" :value="e.id">{{ e.nombre }}</option>
          </select>
          <select v-model="filtros.canal" class="input w-48">
            <option value="">Todos los canales</option>
            <option v-for="c in catalogos.canalesOrigen" :key="c.id" :value="c.id">{{ c.nombre }}</option>
          </select>
          <button @click="resetFiltros" class="btn btn-secondary">Limpiar</button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="table-header">
              <th class="px-4 py-3 text-left">Cliente</th>
              <th class="px-4 py-3 text-left">RUC</th>
              <th class="px-4 py-3 text-left">Canal</th>
              <th class="px-4 py-3 text-left">Estado</th>
              <th class="px-4 py-3 text-left">Interés</th>
              <th class="px-4 py-3 text-left">Contactos</th>
              <th class="px-4 py-3 text-left">Último Contacto</th>
              <th class="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in prospectos" :key="p.id" class="table-row">
              <td class="px-4 py-3">
                <div class="font-medium text-gray-900">{{ p.nombre_contacto }}</div>
                <div class="text-sm text-gray-500">{{ p.empresa || '-' }}</div>
              </td>
              <td class="px-4 py-3 text-gray-600">{{ p.ruc_dni || '-' }}</td>
              <td class="px-4 py-3">
                <span class="badge badge-info">{{ p.canal_origen_codigo }}</span>
              </td>
              <td class="px-4 py-3">
                <span :class="getEstadoClass(p.estado_codigo)" class="badge">
                  {{ p.estado_nombre }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span v-if="p.nivel_interes_codigo" :class="getInteresClass(p.nivel_interes_codigo)" class="badge">
                  {{ p.nivel_interes_codigo }}
                </span>
                <span v-else class="text-gray-400">-</span>
              </td>
              <td class="px-4 py-3 text-center">
                <span class="font-medium">{{ p.total_intentos || 0 }}</span>
                <span class="text-gray-400 text-sm">/ {{ p.contactos_exitosos || 0 }}</span>
              </td>
              <td class="px-4 py-3 text-gray-500 text-sm">
                {{ p.fecha_ultima_actividad ? formatDate(p.fecha_ultima_actividad) : '-' }}
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center justify-center gap-2">
                  <router-link :to="`/prospectos/${p.id}`" class="p-2 text-primary-600 hover:bg-primary-50 rounded-lg" title="Ver detalle">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </router-link>
                  <button @click="registrarContacto(p)" class="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Registrar contacto">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="prospectos.length === 0" class="p-8 text-center text-gray-500">
        No se encontraron prospectos
      </div>
    </div>

    <ModalNuevoProspecto v-if="showModalNuevo" @close="showModalNuevo = false" @created="onProspectoCreado" />
    <ModalContacto v-if="showModalContacto" :prospecto="prospectoSeleccionado" @close="showModalContacto = false" @saved="onContactoGuardado" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { api } from '../services/api'
import { useCatalogosStore } from '../stores/catalogos'
import ModalNuevoProspecto from '../components/ModalNuevoProspecto.vue'
import ModalContacto from '../components/ModalContacto.vue'

const catalogos = useCatalogosStore()

const prospectos = ref([])
const loading = ref(false)
const showModalNuevo = ref(false)
const showModalContacto = ref(false)
const prospectoSeleccionado = ref(null)

const filtros = ref({
  busqueda: '',
  estado: '',
  canal: ''
})

async function cargarProspectos() {
  loading.value = true
  try {
    const params = {}
    if (filtros.value.busqueda) params.busqueda = filtros.value.busqueda
    if (filtros.value.estado) params.estado_id = filtros.value.estado
    if (filtros.value.canal) params.canal_origen_id = filtros.value.canal

    const response = await api.get('/prospectos', { params })
    prospectos.value = response.data.data
  } catch (error) {
    console.error('Error:', error)
  } finally {
    loading.value = false
  }
}

function resetFiltros() {
  filtros.value = { busqueda: '', estado: '', canal: '' }
}

function registrarContacto(prospecto) {
  prospectoSeleccionado.value = prospecto
  showModalContacto.value = true
}

function onProspectoCreado() {
  showModalNuevo.value = false
  cargarProspectos()
}

function onContactoGuardado() {
  showModalContacto.value = false
  cargarProspectos()
}

function getEstadoClass(codigo) {
  const classes = {
    'GANADO': 'badge-success',
    'PERDIDO': 'badge-danger',
    'DEMO': 'badge-warning',
    'NEGOCIANDO': 'badge-warning',
    'COTIZADO': 'badge-info',
    'INTERESADO': 'badge-info'
  }
  return classes[codigo] || 'badge-gray'
}

function getInteresClass(codigo) {
  const classes = {
    'M': 'badge-success',
    'P': 'badge-warning',
    'N': 'badge-danger'
  }
  return classes[codigo] || 'badge-gray'
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('es-PE')
}

watch(filtros, () => {
  cargarProspectos()
}, { deep: true })

onMounted(async () => {
  await catalogos.cargarTodo()
  cargarProspectos()
})
</script>
