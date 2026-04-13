<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold text-gray-900">Nuevo Prospecto</h2>
          <button @click="$emit('close')" class="p-2 hover:bg-gray-100 rounded-lg">
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2">
            <label class="label">Nombre del contacto *</label>
            <input v-model="form.nombre_contacto" type="text" class="input" required />
          </div>

          <div class="col-span-2">
            <label class="label">Empresa</label>
            <input v-model="form.empresa" type="text" class="input" />
          </div>

          <div>
            <label class="label">RUC</label>
            <input v-model="form.ruc_dni" type="text" class="input" maxlength="11" />
          </div>

          <div>
            <label class="label">Canal de Origen *</label>
            <select v-model="form.canal_origen_id" class="input" required>
              <option value="">Seleccionar...</option>
              <option v-for="c in catalogos.canalesOrigen" :key="c.id" :value="c.id">
                ({{ c.codigo }}) {{ c.nombre }}
              </option>
            </select>
          </div>

          <div>
            <label class="label">Teléfono</label>
            <input v-model="form.telefono" type="tel" class="input" />
          </div>

          <div>
            <label class="label">Email</label>
            <input v-model="form.email" type="email" class="input" />
          </div>

          <div>
            <label class="label">Cargo</label>
            <input v-model="form.cargo" type="text" class="input" />
          </div>

          <div>
            <label class="label">Ciudad</label>
            <input v-model="form.ciudad" type="text" class="input" />
          </div>

          <div class="col-span-2">
            <label class="label">Observaciones</label>
            <textarea v-model="form.observaciones_generales" class="input" rows="2"></textarea>
          </div>
        </div>

        <div v-if="error" class="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          {{ error }}
        </div>

        <div class="flex justify-end gap-3 pt-4">
          <button type="button" @click="$emit('close')" class="btn btn-secondary">Cancelar</button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Guardando...' : 'Crear Prospecto' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { api } from '../services/api'
import { useCatalogosStore } from '../stores/catalogos'

const emit = defineEmits(['close', 'created'])
const catalogos = useCatalogosStore()

const form = ref({
  nombre_contacto: '',
  empresa: '',
  ruc_dni: '',
  canal_origen_id: '',
  telefono: '',
  email: '',
  cargo: '',
  ciudad: '',
  observaciones_generales: ''
})

const loading = ref(false)
const error = ref('')

async function handleSubmit() {
  error.value = ''
  loading.value = true

  try {
    await api.post('/prospectos', form.value)
    emit('created')
  } catch (e) {
    error.value = e.response?.data?.message || 'Error al crear prospecto'
  } finally {
    loading.value = false
  }
}
</script>
