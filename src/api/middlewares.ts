import { authenticate } from "@medusajs/medusa/auth"
import { defineMiddlewares } from "@medusajs/medusa"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/vendors/*",
      middlewares: [authenticate("vendor", ["session", "bearer"])],
    },
  ],
})
