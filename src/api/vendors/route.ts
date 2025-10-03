import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createVendorWorkflow } from "../../workflows/marketplace/create-vendor"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const body = req.body as Record<string, unknown>
    const handle = body.handle as string
    const name = body.name as string
    const logo_url = body.logo_url as string | undefined
    const admin_email = body.admin_email as string
    const admin_password = body.admin_password as string
    const admin_first_name = body.admin_first_name as string
    const admin_last_name = body.admin_last_name as string
    const metadata = body.metadata as Record<string, unknown> | undefined

    if (!handle || !name || !admin_email || !admin_password || !admin_first_name || !admin_last_name) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: handle, name, admin_email, admin_password, admin_first_name, admin_last_name",
      })
    }

    const { result } = await createVendorWorkflow(req.scope).run({
      input: {
        handle,
        name,
        logo_url,
        admin_email,
        admin_password,
        admin_first_name,
        admin_last_name,
        metadata,
      },
    })

    const backendUrl = process.env.BACKEND_URL || "http://localhost:9000"

    res.json({
      success: true,
      vendor: {
        id: result.vendor.id,
        handle: result.vendor.handle,
        name: result.vendor.name,
        logo_url: result.vendor.logo_url,
        admin_url: `${backendUrl}/app`,
        api_url: `${backendUrl}/store`,
      },
      admin: {
        id: result.vendorAdmin.id,
        email: result.vendorAdmin.email,
        initial_password: admin_password,
        login_url: `${backendUrl}/app`,
      },
    })
  } catch (error) {
    console.error("Vendor creation error:", error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Failed to create vendor",
    })
  }
}
