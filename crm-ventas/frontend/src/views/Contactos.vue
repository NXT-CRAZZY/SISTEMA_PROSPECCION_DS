<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Contactos</h1>
        <p class="text-gray-500">Historial de intentos de contacto</p>
      </div>
    </div>

    <div class="card mb-6">
      <div class="p-4 border-b border-gray-100">
        <div class="flex flex-wrap gap-4">
          <div class="flex-1 min-w-[200px]">
            <input v-model="filtros.busqueda" type="text" class="input" placeholder="Buscar prospecto..." />
          </div>
          <input v-model="filtros.fecha_inicio" type="date" class="input w-40" />
          <input v-model="filtros.fecha_fin" type="date" class="input w-40" />
          <button @click="cargarContactos" class="btn btn-primary">Buscar</button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="table-header">
              <th class="px-4 py-3 text-left">Fecha</th>
              <th class="px-4 py-3 text-left">Prospecto</th>
              <th class="px-4 py-3 text-left">Canal</th>
              <th class="px-4 py-3 text-left">Resultado</th>
              <th class="px-4 py-3 text-left">Logro</th>
              <th class="px-4 py-3 text-left">Vendedor</th>
              <th class="px-4 py-3 text-left">Observaciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in contactos" :key="c.id" class="table-row">
              <td class="px-4 py-3 text-sm">{{ formatDate(c.fecha_contacto) }}</td>
              <td class="px-4 py-3">
                <div class="font-medium">{{ c.prospecto_nombre }}</div>
                <div class="text-sm text-gray-500">{{ c.prospecto_empresa || '-' }}</div>
              </td>
              <td class="px-4 py-3">
                <span class="badge badge-info">{{ c.canal_contacto_codigo }}</span>
              </td>
              <td class="px-4 py-3">
                <span :class="c.contacto_exitoso ? 'badge-success' : 'badge-gray'" class="badge">
                  {{ c.resultado_nombre }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span v-if="c.logro_nombre" class="badge badge-warning">{{ c.logro_codigo }}</span>
                <span v-else class="text-gray-400">-</span>
              </td>
              <td class="px-4 py-3 text-sm">{{ c.vendedor_nombre }}</td>
              <td class="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{{ c.observaciones || '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="contactos.length === 0" class="p-8 text-center text-gray-500">
        No se encontraron contactos
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../services/api'

const contactos = ref([])
const filtros = ref({
  busqueda: '',
  fecha_inicio: '',
  fecha_fin: ''
})

async function cargarContactos() {
  try {
    const params = {}
    if (filtros.value.fecha_inicio) params.fecha_inicio = filtros.value.fecha_inicio
    if (filtros.value.fecha_fin) params.fecha_fin = filtros.value.fecha_fin

    const response = await api.get('/intentos-contacto', { params })
    contactos.value = response.data.data
  } catch (error) {
    console.error('Error:', error)
  }
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('es-PE')
}

onMounted(cargarContactos)
</script>
