import { createRouter, createWebHistory } from "vue-router";
import AdminLogin from "../views/AdminLogin.vue";
import AdminDashboard from "../views/AdminDashboard.vue";
import CustomerList from "../views/CustomerList.vue";  // Updated name

const routes = [
  {
    path: "/admin-login",
    component: AdminLogin
  },
  {
    path: "/admin-dashboard",
    component: AdminDashboard,
    name: 'AdminDashboard'
  },
  {
    path: "/dashboard",
    redirect: "/admin-dashboard"
  },
  {
    path: "/customers", 
    component: CustomerList,  // Updated reference
  },
  {
    path: "/",
    redirect: "/admin-login"
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
