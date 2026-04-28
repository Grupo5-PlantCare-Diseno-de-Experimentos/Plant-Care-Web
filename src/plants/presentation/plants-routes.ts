import type { RouteRecordRaw } from 'vue-router';

export default [
  {
    path: '',
    name: 'PlantsList',
    component: () => import('./views/Plants.vue'),
  },
  {
    path: 'new',
    name: 'PlantsForm',
    component: () => import('./views/PlantsForm.vue'),
  },
  {
    path: 'edit/:id',
    name: 'PlantsEdit',
    component: () => import('./views/PlantsForm.vue'),
    props: true
  },
  {
    path: ':id',
    name: 'PlantDetail',
    component: () => import('./views/PlantDetail.vue'),
    props: true
  }
] as RouteRecordRaw[];
