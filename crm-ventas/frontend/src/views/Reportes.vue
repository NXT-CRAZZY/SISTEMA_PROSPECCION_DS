<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Reportes</h1>
        <p class="text-gray-500">Generación de reportes Excel</p>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="card p-6">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h2 class="text-lg font-semibold text-gray-900">Reporte de Seguimiento</h2>
            <p class="text-sm text-gray-500">Prospectos, contactos y conversiones</p>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <label class="label">Vendedor (opcional)</label>
            <select v-model="seguimiento.vendedor_id" class="input">
              <option value="">Todos los vendedores</option>
              <option v-for="v in catalogos.vendedores" :key="v.id" :value="v.id">
                {{ v.nombre }}
              </option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">Fecha Inicio</label>
              <input v-model="seguimiento.fecha_inicio" type="date" class="input" />
            </div>
            <div>
              <label class="label">Fecha Fin</label>
              <input v-model="seguimiento.fecha_fin" type="date" class="input" />
            </div>
          </div>

          <button @click="generarReporte('seguimiento')" class="btn btn-success w-full flex items-center justify-center gap-2" :disabled="generando">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {{ generando === 'seguimiento' ? 'Generando...' : 'Descargar Excel' }}
          </button>
        </div>
      </div>

      <div class="card p-6">
        <div class="flex items-center gap-4 mb-6">
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 class="text-lg font-semibold text-gray-900">Reporte de Ventas</h2>
            <p class="text-sm text-gray-500">Ventas realizadas y montos</p>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <label class="label">Vendedor (opcional)</label>
            <select v-model="ventas.vendedor_id" class="input">
              <option value="">Todos los vendedores</option>
              <option v-for="v in catalogos.vendedores" :key="v.id" :value="v.id">
                {{ v.nombre }}
              </option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">Fecha Inicio</label>
              <input v-model="ventas.fecha_inicio" type="date" class="input" />
            </div>
            <div>
              <label class="label">Fecha Fin</label>
              <input v-model="ventas.fecha_fin" type="date" class="input" />
            </div>
          </div>

          <button @click="generarReporte('ventas')" class="btn btn-primary w-full flex items-center justify-center gap-2" :disabled="generando">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {{ generando === 'ventas' ? 'Generando...' : 'Descargar Excel' }}
          </button>
        </div>
      </div>
    </div>

    <div class="card mt-6 p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Historial de Reportes</h2>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="table-header">
              <th class="px-4 py-3 text-left">Fecha</th>
              <th class="px-4 py-3 text-left">Tipo</th>
              <th class="px-4 py-3 text-left">Usuario</th>
              <th class="px-4 py-3 text-left">Archivo</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in historial" :key="r.id" class="table-row">
              <td class="px-4 py-3 text-sm">{{ formatDate(r.creado_en) }}</td>
              <td class="px-4 py-3">
                <span class="badge" :class="r.tipo_reporte === 'VENTAS' ? 'badge-info' : 'badge-success'">
                  {{ r.tipo_reporte }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm">{{ r.usuario_nombre }}</td>
              <td class="px-4 py-3 text-sm text-gray-500">{{ r.nombre_archivo }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="historial.length === 0" class="p-4 text-center text-gray-500">Sin reportes generados</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../services/api'
import { useCatalogosStore } from '../stores/catalogos'
import { useAuthStore } from '../stores/auth'

const catalogos = useCatalogosStore()
const authStore = useAuthStore()

const seguimiento = ref({ vendedor_id: '', fecha_inicio: '', fecha_fin: '' })
const ventas = ref({ vendedor_id: '', fecha_inicio: '', fecha_fin: '' })
const historial = ref([])
const generando = ref(null)

async function generarReporte(tipo) {
  generando.value = tipo

  try {
    const params = tipo === 'seguimiento' ? { ...seguimiento.value } : { ...ventas.value }
    const endpoint = tipo === 'seguimiento' ? '/reportes/seguimiento' : '/reportes/ventas'

    const response = await api.get(endpoint, { params, responseType: 'blob' })

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Reporte_${tipo}_${new Date().toISOString().split('T')[0]}.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)

    cargarHistorial()
  } catch (error) {
    console.error('Error:', error)
    alert('Error al generar el reporte')
  } finally {
    generando.value = null
  }
}

async function cargarHistorial() {
  if (!authStore.isSupervisor) return
  try {
    const response = await api.get('/reportes/historial')
    historial.value = response.data.data
  } catch (error) {
    console.error('Error:', error)
  }
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('es-PE')
}

onMounted(async () => {
  await catalogos.cargarVendedores()
  cargarHistorial()
})
</script>
