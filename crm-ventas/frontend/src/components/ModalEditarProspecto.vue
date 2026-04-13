<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-lg">
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold text-gray-900">Editar Prospecto</h2>
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
            <label class="label">Teléfono</label>
            <input v-model="form.telefono" type="tel" class="input" />
          </div>

          <div>
            <label class="label">Email</label>
            <input v-model="form.email" type="email" class="input" />
          </div>

          <div>
            <label class="label">Ciudad</label>
            <input v-model="form.ciudad" type="text" class="input" />
          </div>
        </div>

        <div>
          <label class="label">Nivel de Interés</label>
          <div class="flex gap-2">
            <button 
              v-for="n in nivelesInteres" 
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
              {{ n.codigo }} - {{ n.nombre.split(' ')[0] }}
            </button>
          </div>
        </div>

        <div>
          <label class="label">Observaciones</label>
          <textarea v-model="form.observaciones_generales" class="input" rows="2"></textarea>
        </div>

        <div v-if="error" class="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          {{ error }}
        </div>

        <div class="flex justify-end gap-3 pt-4">
          <button type="button" @click="$emit('close')" class="btn btn-secondary">Cancelar</button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../services/api'
import { useCatalogosStore } from '../stores/catalogos'

const props = defineProps(['prospecto'])
const emit = defineEmits(['close', 'saved'])
const catalogos = useCatalogosStore()

const form = ref({
  nombre_contacto: '',
  empresa: '',
  ruc_dni: '',
  telefono: '',
  email: '',
  ciudad: '',
  nivel_interes_id: '',
  observaciones_generales: ''
})

const nivelesInteres = ref([])
const loading = ref(false)
const error = ref('')

onMounted(async () => {
  await catalogos.cargarNivelesInteres()
  nivelesInteres.value = catalogos.nivelesInteres

  form.value = {
    nombre_contacto: props.prospecto.nombre_contacto || '',
    empresa: props.prospecto.empresa || '',
    ruc_dni: props.prospecto.ruc_dni || '',
    telefono: props.prospecto.telefono || '',
    email: props.prospecto.email || '',
    ciudad: props.prospecto.ciudad || '',
    nivel_interes_id: props.prospecto.nivel_interes_id || '',
    observaciones_generales: props.prospecto.observaciones_generales || ''
  }
})

async function handleSubmit() {
  error.value = ''
  loading.value = true

  try {
    await api.put(`/prospectos/${props.prospecto.id}`, form.value)
    emit('saved')
  } catch (e) {
    error.value = e.response?.data?.message || 'Error al actualizar'
  } finally {
    loading.value = false
  }
}
</script>
