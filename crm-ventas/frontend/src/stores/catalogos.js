import { defineStore } from 'pinia'
import { api } from '../services/api'

export const useCatalogosStore = defineStore('catalogos', {
  state: () => ({
    canalesOrigen: [],
    canalesContacto: [],
    resultadosContacto: [],
    logrosContacto: [],
    modalidades: [],
    nivelesInteres: [],
    estadosProspecto: [],
    productos: [],
    vendedores: []
  }),

  actions: {
    async cargarCanalesOrigen() {
      const response = await api.get('/canales-origen')
      this.canalesOrigen = response.data.data
    },

    async cargarCanalesContacto() {
      const response = await api.get('/canales-contacto')
      this.canalesContacto = response.data.data
    },

    async cargarResultadosContacto() {
      const response = await api.get('/resultados-contacto')
      this.resultadosContacto = response.data.data
    },

    async cargarLogrosContacto() {
      const response = await api.get('/logros-contacto')
      this.logrosContacto = response.data.data
    },

    async cargarModalidades() {
      const response = await api.get('/modalidades')
      this.modalidades = response.data.data
    },

    async cargarNivelesInteres() {
      const response = await api.get('/niveles-interes')
      this.nivelesInteres = response.data.data
    },

    async cargarEstadosProspecto() {
      const response = await api.get('/estados-prospecto')
      this.estadosProspecto = response.data.data
    },

    async cargarProductos() {
      const response = await api.get('/productos')
      this.productos = response.data.data
    },

    async cargarVendedores() {
      const response = await api.get('/usuarios')
      this.vendedores = response.data.data.filter(u => u.rol === 'vendedor')
    },

    async cargarTodo() {
      await Promise.all([
        this.cargarCanalesOrigen(),
        this.cargarCanalesContacto(),
        this.cargarResultadosContacto(),
        this.cargarLogrosContacto(),
        this.cargarModalidades(),
        this.cargarNivelesInteres(),
        this.cargarEstadosProspecto(),
        this.cargarProductos(),
        this.cargarVendedores()
      ])
    },

    getResultadosPorCanal(canalId) {
      return this.resultadosContacto.filter(r => r.canal_contacto_id == canalId || r.canal_contacto_id == null)
    }
  }
})
