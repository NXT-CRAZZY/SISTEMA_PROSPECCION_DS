<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p class="text-gray-500">Resumen de desempeño de ventas</p>
      </div>
      <div class="flex gap-2">
        <select v-model="filtroVendedor" class="input w-48">
          <option value="">Todos los vendedores</option>
          <option v-for="v in catalogos.vendedores" :key="v.id" :value="v.id">
            {{ v.nombre }}
          </option>
        </select>
        <select v-model="filtroAnio" class="input w-32">
          <option v-for="a in años" :key="a" :value="a">{{ a }}</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
    </div>

    <div v-else>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="stat-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="stat-label">Total Prospectos</p>
              <p class="stat-value">{{ resumen.total_prospectos }}</p>
            </div>
            <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="stat-label">Ventas Totales</p>
              <p class="stat-value">S/. {{ formatNumber(resumen.monto_total_ventas) }}</p>
            </div>
            <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="stat-label">Cotizaciones</p>
              <p class="stat-value">S/. {{ formatNumber(resumen.monto_total_cotizaciones) }}</p>
            </div>
            <div class="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div class="stat-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="stat-label">Tasa Conversión</p>
              <p class="stat-value">{{ resumen.tasa_conversion_porcentaje }}%</p>
            </div>
            <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div class="card p-6">
          <h3 class="font-semibold text-gray-900 mb-4">Ventas por Mes ({{ filtroAnio }})</h3>
          <div class="h-64">
            <Bar :data="chartData.ventas" :options="chartOptions.bar" />
          </div>
        </div>

        <div class="card p-6">
          <h3 class="font-semibold text-gray-900 mb-4">Prospectos por Estado</h3>
          <div class="h-64">
            <Doughnut :data="chartData.estados" :options="chartOptions.doughnut" />
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card p-6">
          <h3 class="font-semibold text-gray-900 mb-4">Prospectos por Canal</h3>
          <div class="h-64">
            <Pie :data="chartData.canales" :options="chartOptions.pie" />
          </div>
        </div>

        <div class="card p-6">
          <h3 class="font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
          <div class="space-y-3 max-h-64 overflow-y-auto">
            <div v-for="act in actividadReciente" :key="act.fecha + act.tipo" class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div :class="act.tipo === 'venta' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'" class="w-8 h-8 rounded-full flex items-center justify-center">
                <svg v-if="act.tipo === 'venta'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ act.prospecto }}</p>
                <p class="text-xs text-gray-500">{{ act.detalle }} - {{ formatDate(act.fecha) }}</p>
              </div>
            </div>
            <p v-if="actividadReciente.length === 0" class="text-center text-gray-500 py-4">Sin actividad reciente</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Bar, Doughnut, Pie } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title } from 'chart.js'
import { api } from '../services/api'
import { useCatalogosStore } from '../stores/catalogos'
import { useAuthStore } from '../stores/auth'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title)

const catalogos = useCatalogosStore()
const authStore = useAuthStore()

const loading = ref(true)
const resumen = ref({})
const ventasPorMes = ref([])
const prospectosEstado = ref([])
const prospectosCanal = ref([])
const actividadReciente = ref([])

const filtroVendedor = ref('')
const filtroAnio = ref(new Date().getFullYear())
const años = computed(() => {
  const currentYear = new Date().getFullYear()
  return [currentYear, currentYear - 1, currentYear - 2]
})

const chartOptions = {
  bar: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } }
  },
  doughnut: { responsive: true, maintainAspectRatio: false },
  pie: { responsive: true, maintainAspectRatio: false }
}

const chartData = computed(() => ({
  ventas: {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    datasets: [{
      label: 'Ventas (S/.)',
      data: ventasPorMes.value,
      backgroundColor: '#3b82f6'
    }]
  },
  estados: {
    labels: prospectosEstado.value.map(e => e.estado),
    datasets: [{
      data: prospectosEstado.value.map(e => e.cantidad),
      backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#ef4444', '#6b7280']
    }]
  },
  canales: {
    labels: prospectosCanal.value.map(c => c.canal),
    datasets: [{
      data: prospectosCanal.value.map(c => c.cantidad),
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4']
    }]
  }
}))

async function cargarDatos() {
  loading.value = true
  try {
    const params = {}
    if (filtroVendedor.value) params.vendedor_id = filtroVendedor.value

    const [resumenRes, ventasRes, estadoRes, canalRes, actividadRes] = await Promise.all([
      api.get('/dashboard/resumen', { params }),
      api.get('/dashboard/ventas-mensuales', { params: { año: filtroAnio.value } }),
      api.get('/dashboard/prospectos-estado', { params }),
      api.get('/dashboard/prospectos-canal', { params }),
      api.get('/dashboard/actividad-reciente', { params: { limite: 10 } })
    ])

    resumen.value = resumenRes.data.data
    ventasPorMes.value = ventasRes.data.data.montos
    prospectosEstado.value = estadoRes.data.data
    prospectosCanal.value = canalRes.data.data
    actividadReciente.value = actividadRes.data.data
  } catch (error) {
    console.error('Error al cargar dashboard:', error)
  } finally {
    loading.value = false
  }
}

function formatNumber(num) {
  return new Intl.NumberFormat('es-PE').format(num || 0)
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('es-PE')
}

watch([filtroVendedor, filtroAnio], cargarDatos)

onMounted(async () => {
  await catalogos.cargarTodo()
  cargarDatos()
})
</script>
