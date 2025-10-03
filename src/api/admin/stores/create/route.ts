import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { createStoresWorkflow } from "@medusajs/medusa/core-flows"
import * as bcrypt from "bcrypt"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  try {
    const {
      store_name,
      admin_email,
      admin_password,
      metadata
    } = req.body

    if (!store_name || !admin_email || !admin_password) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: store_name, admin_email, admin_password"
      })
    }

    const container = req.scope

    // Create the store using Medusa's createStoresWorkflow
    const { result: storeResult } = await createStoresWorkflow(container).run({
      input: {
        stores: [{
          name: store_name,
          supported_currencies: [{
            currency_code: "usd",
            is_default: true
          }],
          metadata: {
            ...metadata,
            colabship_managed: true,
            created_at: new Date().toISOString()
          }
        }]
      }
    })

    const createdStore = storeResult[0]

    // Create admin user for this store
    const userModuleService = container.resolve(Modules.USER)

    // Hash password using bcrypt
    const hashedPassword = await bcrypt.hash(admin_password, 10)

    const adminUser = await userModuleService.createUsers({
      email: admin_email,
      metadata: {
        store_id: createdStore.id,
        is_store_admin: true,
        colabship_managed: true
      }
    })

    // Store the password in auth module (this is Medusa-specific)
    const authModuleService = container.resolve(Modules.AUTH)
    await authModuleService.create({
      entity_id: adminUser.id,
      provider: "emailpass",
      provider_metadata: {
        password: hashedPassword
      },
      scope: "admin",
      app_metadata: {
        store_id: createdStore.id
      }
    })

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:9000'

    res.json({
      success: true,
      store: {
        id: createdStore.id,
        name: createdStore.name,
        admin_url: `${backendUrl}/app`,
        api_url: `${backendUrl}/store`
      },
      admin: {
        id: adminUser.id,
        email: admin_email,
        initial_password: admin_password, // Send back for Colabship to store
        login_url: `${backendUrl}/app`
      }
    })
  } catch (error) {
    console.error("Store creation error:", error)
    res.status(500).json({
      success: false,
      error: error.message || "Failed to create store"
    })
  }
}
