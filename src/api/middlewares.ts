import { defineMiddlewares } from "@medusajs/medusa"
import { authenticate } from "@medusajs/medusa"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/vendors/*",
      middlewares: [authenticate("vendor", ["session", "bearer"])],
    },
  ],
})
