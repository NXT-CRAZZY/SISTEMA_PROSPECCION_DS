<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold text-gray-900">Registrar Contacto</h2>
          <button @click="$emit('close')" class="p-2 hover:bg-gray-100 rounded-lg">
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p class="text-gray-500 mt-1">{{ prospecto.nombre_contacto }} - {{ prospecto.empresa || 'Sin empresa' }}</p>
      </div>

      <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="label">Fecha de Contacto *</label>
            <input v-model="form.fecha_contacto" type="date" class="input" required />
          </div>

          <div>
            <label class="label">Canal de Contacto *</label>
            <select v-model="form.canal_contacto_id" class="input" required @change="onCanalChange">
              <option value="">Seleccionar...</option>
              <option v-for="c in catalogos.canalesContacto" :key="c.id" :value="c.id">
                {{ c.nombre }}
              </option>
            </select>
          </div>

          <div>
            <label class="label">Resultado *</label>
            <select v-model="form.resultado_id" class="input" required>
              <option value="">Seleccionar...</option>
              <option v-for="r in resultadosFiltrados" :key="r.id" :value="r.id">
                {{ r.nombre }}
              </option>
            </select>
          </div>

          <div>
            <label class="label">Modalidad</label>
            <select v-model="form.modalidad_id" class="input">
              <option value="">Seleccionar...</option>
              <option v-for="m in catalogos.modalidades" :key="m.id" :value="m.id">
                {{ m.nombre }}
              </option>
            </select>
          </div>
        </div>

        <div v-if="contactoExitoso" class="space-y-4 border-t border-gray-100 pt-4">
          <h3 class="font-medium text-gray-700">Información del Logro (Contacto Exitoso)</h3>
          
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="label">Logro Alcanzado</label>
              <select v-model="form.logro_id" class="input">
                <option value="">Seleccionar...</option>
                <option v-for="l in catalogos.logrosContacto" :key="l.id" :value="l.id">
                  {{ l.nombre }}
                </option>
              </select>
            </div>

            <div>
              <label class="label">Nivel de Interés</label>
              <div class="flex gap-2 mt-1">
                <button 
                  v-for="n in catalogos.nivelesInteres" 
                  :key="n.id"
                  type="button"
                  @click="form.nivel_interes_id = n.id"
                  :class="[
                    'flex-1 py-2 rounded-lg border transition-all',
                    form.nivel_interes_id === n.id 
                      ? (n.codigo === 'M' ? 'bg-green-100 border-green-500 text-green-700' : 
                         n.codigo === 'P' ? 'bg-yellow-100 border-yellow-500 text-yellow-700' : 
                         'bg-red-100 border-red-500 text-red-700')
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  ]"
                >
                  {{ n.codigo }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <div>
            <label class="label">Próxima Acción</label>
            <input v-model="form.proxima_accion" type="text" class="input" placeholder="Ej: Enviar cotización, Llamar mañana" />
          </div>

          <div>
            <label class="label">Fecha Próxima Acción</label>
            <input v-model="form.fecha_proxima_accion" type="date" class="input" />
          </div>

          <div>
            <label class="label">Observaciones</label>
            <textarea v-model="form.observaciones" class="input" rows="2" placeholder="Notas sobre el contacto..."></textarea>
          </div>
        </div>

        <div v-if="error" class="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          {{ error }}
        </div>

        <div class="flex justify-end gap-3 pt-4">
          <button type="button" @click="$emit('close')" class="btn btn-secondary">Cancelar</button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Guardando...' : 'Registrar Contacto' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { api } from '../services/api'
import { useCatalogosStore } from '../stores/catalogos'

const props = defineProps(['prospecto'])
const emit = defineEmits(['close', 'saved'])
const catalogos = useCatalogosStore()

const form = ref({
  prospecto_id: props.prospecto.id,
  fecha_contacto: new Date().toISOString().split('T')[0],
  canal_contacto_id: '',
  modalidad_id: '',
  resultado_id: '',
  logro_id: '',
  nivel_interes_id: '',
  proxima_accion: '',
  fecha_proxima_accion: '',
  observaciones: ''
})

const loading = ref(false)
const error = ref('')
const resultadoSeleccionado = ref(null)

const resultadosFiltrados = computed(() => {
  if (!form.value.canal_contacto_id) return []
  return catalogos.getResultadosPorCanal(form.value.canal_contacto_id)
})

const contactoExitoso = computed(() => {
  return resultadoSeleccionado.value?.contacto_exitoso === 1 || resultadoSeleccionado.value?.contacto_exitoso === true
})

watch(() => form.value.resultado_id, (newId) => {
  if (newId) {
    resultadoSeleccionado.value = catalogos.resultadosContacto.find(r => r.id == newId)
  }
})

function onCanalChange() {
  form.value.resultado_id = ''
  resultadoSeleccionado.value = null
}

async function handleSubmit() {
  error.value = ''
  loading.value = true

  try {
    await api.post('/intentos-contacto', form.value)
    emit('saved')
  } catch (e) {
    error.value = e.response?.data?.message || 'Error al registrar contacto'
  } finally {
    loading.value = false
  }
}
</script>
