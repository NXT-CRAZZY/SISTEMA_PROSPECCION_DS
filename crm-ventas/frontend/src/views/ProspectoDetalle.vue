<template>
  <div class="p-6">
    <div class="flex items-center gap-4 mb-6">
      <router-link to="/prospectos" class="p-2 hover:bg-gray-100 rounded-lg">
        <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </router-link>
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ prospecto.nombre_contacto }}</h1>
        <p class="text-gray-500">{{ prospecto.empresa || 'Sin empresa' }}</p>
      </div>
      <span :class="getEstadoClass(prospecto.estado_codigo)" class="badge ml-auto">
        {{ prospecto.estado_nombre }}
      </span>
    </div>

    <div v-if="loading" class="flex items-center justify-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <div class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">Datos del Prospecto</h2>
            <button @click="showEditar = true" class="btn btn-secondary text-sm">Editar</button>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500">RUC/DNI</p>
              <p class="font-medium">{{ prospecto.ruc_dni || '-' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Teléfono</p>
              <p class="font-medium">{{ prospecto.telefono || '-' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Email</p>
              <p class="font-medium">{{ prospecto.email || '-' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Cargo</p>
              <p class="font-medium">{{ prospecto.cargo || '-' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Canal de Origen</p>
              <p class="font-medium">{{ prospecto.canal_origen_nombre || '-' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Ciudad</p>
              <p class="font-medium">{{ prospecto.ciudad || '-' }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Nivel de Interés</p>
              <span v-if="prospecto.nivel_interes_codigo" :class="getInteresClass(prospecto.nivel_interes_codigo)" class="badge">
                {{ prospecto.nivel_interes_nombre }}
              </span>
              <span v-else class="text-gray-400">No definido</span>
            </div>
            <div>
              <p class="text-sm text-gray-500">Vendedor</p>
              <p class="font-medium">{{ prospecto.vendedor_nombre }}</p>
            </div>
          </div>
        </div>

        <div class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">Historial de Contactos</h2>
            <button @click="showContacto = true" class="btn btn-primary text-sm">+ Nuevo Contacto</button>
          </div>
          <div class="space-y-3">
            <div v-for="c in prospecto.intentos_contacto" :key="c.id" class="p-4 bg-gray-50 rounded-lg">
              <div class="flex items-start justify-between">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-medium">{{ c.canal_contacto_nombre }}</span>
                    <span :class="c.contacto_exitoso ? 'badge-success' : 'badge-gray'" class="badge text-xs">
                      {{ c.resultado_nombre }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-500 mt-1">
                    {{ formatDate(c.fecha_contacto) }}
                    <span v-if="c.modalidad_nombre"> • {{ c.modalidad_nombre }}</span>
                  </p>
                </div>
                <span v-if="c.logro_nombre" class="badge badge-info">{{ c.logro_codigo }}</span>
              </div>
              <p v-if="c.observaciones" class="text-sm text-gray-600 mt-2">{{ c.observaciones }}</p>
            </div>
            <p v-if="!prospecto.intentos_contacto?.length" class="text-center text-gray-500 py-4">Sin contactos registrados</p>
          </div>
        </div>

        <div v-if="prospecto.cotizaciones?.length" class="card p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Cotizaciones</h2>
          <div class="space-y-3">
            <div v-for="cot in prospecto.cotizaciones" :key="cot.id" class="p-4 bg-gray-50 rounded-lg">
              <div class="flex items-center justify-between">
                <div>
                  <span class="font-medium">{{ cot.producto_nombre }}</span>
                  <span class="ml-2 badge" :class="cot.estado === 'ACEPTADA' ? 'badge-success' : 'badge-warning'">
                    {{ cot.estado }}
                  </span>
                </div>
                <span class="font-bold text-primary-600">S/. {{ formatNumber(cot.monto_final) }}</span>
              </div>
              <p class="text-sm text-gray-500 mt-1">{{ formatDate(cot.fecha_cotizacion) }}</p>
            </div>
          </div>
        </div>

        <div v-if="prospecto.ventas?.length" class="card p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Ventas</h2>
          <div class="space-y-3">
            <div v-for="v in prospecto.ventas" :key="v.id" class="p-4 bg-green-50 rounded-lg">
              <div class="flex items-center justify-between">
                <div>
                  <span class="font-medium">{{ v.producto_nombre }}</span>
                  <span class="ml-2 badge badge-success">Venta</span>
                </div>
                <span class="font-bold text-green-600">S/. {{ formatNumber(v.monto_total) }}</span>
              </div>
              <p class="text-sm text-gray-500 mt-1">{{ formatDate(v.fecha_venta) }} • {{ v.tipo_comprobante_nombre }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div class="card p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Resumen</h3>
          <div class="space-y-4">
            <div class="flex justify-between">
              <span class="text-gray-500">Total Intentos</span>
              <span class="font-medium">{{ prospecto.intentos_contacto?.length || 0 }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Contactos Exitosos</span>
              <span class="font-medium text-green-600">{{ contactosExitosos }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Cotizaciones</span>
              <span class="font-medium">{{ prospecto.cotizaciones?.length || 0 }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Ventas</span>
              <span class="font-medium">{{ prospecto.ventas?.length || 0 }}</span>
            </div>
          </div>
        </div>

        <div v-if="prospecto.fecha_proxima_accion" class="card p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Próxima Acción</h3>
          <p class="text-gray-600">{{ prospecto.proxima_accion || 'Sin acción programada' }}</p>
          <p class="text-sm text-gray-500 mt-1">{{ formatDate(prospecto.fecha_proxima_accion) }}</p>
        </div>

        <div v-if="prospecto.observaciones_generales" class="card p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Observaciones</h3>
          <p class="text-gray-600">{{ prospecto.observaciones_generales }}</p>
        </div>
      </div>
    </div>

    <ModalContacto v-if="showContacto" :prospecto="prospecto" @close="showContacto = false" @saved="cargarDetalle" />
    <ModalEditarProspecto v-if="showEditar" :prospecto="prospecto" @close="showEditar = false" @saved="cargarDetalle" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../services/api'
import ModalContacto from '../components/ModalContacto.vue'
import ModalEditarProspecto from '../components/ModalEditarProspecto.vue'

const route = useRoute()
const prospecto = ref({})
const loading = ref(false)
const showContacto = ref(false)
const showEditar = ref(false)

const contactosExitosos = computed(() => {
  return prospecto.value.intentos_contacto?.filter(c => c.contacto_exitoso).length || 0
})

async function cargarDetalle() {
  loading.value = true
  try {
    const response = await api.get(`/prospectos/${route.params.id}`)
    prospecto.value = response.data.data
  } catch (error) {
    console.error('Error:', error)
  } finally {
    loading.value = false
  }
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
  const classes = { 'M': 'badge-success', 'P': 'badge-warning', 'N': 'badge-danger' }
  return classes[codigo] || 'badge-gray'
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('es-PE')
}

function formatNumber(num) {
  return new Intl.NumberFormat('es-PE').format(num || 0)
}

onMounted(cargarDetalle)
</script>
