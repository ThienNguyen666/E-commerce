import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),         // / -> Home
  route("/login", "pages/Login.tsx"),      // /login -> Login page
  route("/register", "pages/Register.tsx"), // /register -> Register page
  route("/products",           "pages/Products.tsx"),
  route("/products/:id",       "pages/ProductDetail.tsx"),
  route("/cart",               "pages/Cart.tsx"),
  route("/orders",             "pages/Orders.tsx"),
  route("/orders/:id",         "pages/OrderDetail.tsx"),
  route("/admin",              "pages/Admin.tsx"),
  route("/admin/analytics",    "pages/Analytics.tsx"),
] satisfies RouteConfig;
