import { createRouter, createWebHistory } from "vue-router";
import AdminLogin from "../views/AdminLogin.vue";
import AdminDashboard from "../views/AdminDashboard.vue";
import CustomerList from "../views/CustomerList.vue";  // Updated name
import ProductList from "../views/ProductList.vue"; 
import ServicesList from "../views/ServicesList.vue";
import UsersList from "../views/UsersList.vue";
import FeedbackList from "../views/FeedbackList.vue";
import ProductPayment from "../views/ProductPayment.vue";
import ServiceBooking from "../views/ServiceBooking.vue";
import ServicePayment from "../views/ServicePayment.vue";
import SupplierManagement from "../views/SupplierManagement.vue";

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
    path: "/supplier-management",
    component: SupplierManagement
  },
  {
    path: "/feedback",
    component: FeedbackList
  },
  {
    path: "/product-payment",
    component: ProductPayment
  },
  {
    path: "/service-booking",
    component: ServiceBooking
  },
  {
    path: "/service-payments",
    component: ServicePayment
  },
  {
    path: "/products",
    component: ProductList  // Removed unnecessary redirect
  },
  {
    path: "/services",
    component: ServicesList  // Removed unnecessary redirect
  },
  {
    path: "/users",
    component: UsersList  // Removed unnecessary redirect
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
