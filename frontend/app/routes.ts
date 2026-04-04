import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),         // / -> Home
  route("/login", "pages/Login.tsx"),      // /login -> Login page
  route("/register", "pages/Register.tsx") // /register -> Register page
] satisfies RouteConfig;
