import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('../views/Layout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue')
      },
      {
        path: 'prospectos',
        name: 'Prospectos',
        component: () => import('../views/Prospectos.vue')
      },
      {
        path: 'prospectos/:id',
        name: 'ProspectoDetalle',
        component: () => import('../views/ProspectoDetalle.vue')
      },
      {
        path: 'contactos',
        name: 'Contactos',
        component: () => import('../views/Contactos.vue')
      },
      {
        path: 'reportes',
        name: 'Reportes',
        component: () => import('../views/Reportes.vue')
      },
      {
        path: 'usuarios',
        name: 'Usuarios',
        component: () => import('../views/Usuarios.vue'),
        meta: { roles: ['administrador'] }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth !== false && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/')
  } else if (to.meta.roles && !to.meta.roles.includes(authStore.user?.rol)) {
    next('/')
  } else {
    next()
  }
})

export default router
