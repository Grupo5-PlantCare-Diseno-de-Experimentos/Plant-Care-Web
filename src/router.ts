import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from './auth/store/authStore';
import { supabase } from './utils/supabase';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    // Auth routes (no layout)
    {
      path: '/login',
      name: 'Login',
      component: () => import('./auth/pages/Login.vue'),
      meta: { hideLayout: true }
    },
    {
      path: '/sign-in',
      name: 'SignIn',
      redirect: '/login'
    },
    {
      path: '/sign-up',
      name: 'SignUp',
      component: () => import('./auth/pages/sign-up.component.vue'),
      meta: { hideLayout: true }
    },
    {
      path: '/complete-profile',
      name: 'CompleteProfile',
      component: () => import('./Profile/Components/CompleteProfile.vue'),
      meta: { hideLayout: true, requiresAuth: true }
    },
    // App routes (with layout)
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('./shared/presentation/components/Dashboard.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/plants',
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'PlantsList',
          component: () => import('./plants/presentation/views/Plants.vue'),
        },
        {
          path: 'new',
          name: 'PlantsForm',
          component: () => import('./plants/presentation/views/PlantsForm.vue'),
        },
        {
          path: 'edit/:id',
          name: 'PlantsEdit',
          component: () => import('./plants/presentation/views/PlantsForm.vue'),
          props: true
        },
        {
          path: ':id',
          name: 'PlantDetail',
          component: () => import('./plants/presentation/views/PlantDetail.vue'),
          props: true
        }
      ]
    },
    {
      path: '/analytics',
      name: 'Analytics',
      component: () => import('./analytics/presentation/views/Analytics.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('./Profile/Components/Profile.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/settings',
      name: 'Settings',
      component: () => import('./shared/presentation/components/Settings.vue'),
      meta: { requiresAuth: true }
    },
  
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard'
    }
  ]
});

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();

  // Ensure the auth store has up-to-date state (safe to call repeatedly)
  try {
    await authStore.initialize();
  } catch (e) {
    // initialization failures should not block navigation
    /* noop */
  }

  let hasValidSession = false;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    hasValidSession = !!session && !!session.access_token && session.access_token === authStore.token;
  } catch (e) {
    hasValidSession = false;
  }

  // Consider the user authenticated only when we have both a user object, a token, and a valid Supabase session
  const isAuth = !!authStore.user && !!authStore.token && hasValidSession;

  if (!hasValidSession) {
    // also clear authStore.token to keep in-memory state consistent
    authStore.token = null as any;
  }

  if (to.meta.requiresAuth && !isAuth) {
    return next({ name: 'Login' });
  }

  // Redirect authenticated users away from auth pages (Login / SignIn)
  if ((to.name === 'Login' || to.name === 'SignIn') && isAuth) {
    return next({ name: 'Dashboard' });
  }

  next();
});

export default router;
