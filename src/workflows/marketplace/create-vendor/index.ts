import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { setAuthAppMetadataStep } from "@medusajs/medusa/core-flows"
import { createVendorStep } from "./steps/create-vendor"
import { createVendorAdminStep } from "./steps/create-vendor-admin"

export interface CreateVendorWorkflowInput {
  handle: string
  name: string
  logo_url?: string
  admin_email: string
  admin_password: string
  admin_first_name: string
  admin_last_name: string
  metadata?: Record<string, unknown>
}

export const createVendorWorkflow = createWorkflow(
  "create-vendor",
  (input: CreateVendorWorkflowInput) => {
    const vendor = createVendorStep({
      handle: input.handle,
      name: input.name,
      logo_url: input.logo_url,
    })

    const vendorAdmin = createVendorAdminStep({
      vendorId: vendor.id,
      email: input.admin_email,
      password: input.admin_password,
      first_name: input.admin_first_name,
      last_name: input.admin_last_name,
    })

    setAuthAppMetadataStep({
      authIdentityId: vendorAdmin.auth_identity_id,
      actorType: "vendor",
      value: vendorAdmin.id,
    })

    return new WorkflowResponse({
      vendor,
      vendorAdmin,
    })
  }
)
