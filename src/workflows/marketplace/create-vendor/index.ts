import {
  createWorkflow,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk"
import {
  setAuthAppMetadataStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { createVendorStep } from "./steps/create-vendor"
import { createVendorAdminStep } from "./steps/create-vendor-admin"

export interface CreateVendorWorkflowInput {
  name: string
  handle?: string
  logo_url?: string
  admin: {
    email: string
    first_name?: string
    last_name?: string
  }
  authIdentityId: string
}

export const createVendorWorkflow = createWorkflow(
  "create-vendor",
  (input: CreateVendorWorkflowInput) => {
    const vendor = createVendorStep({
      name: input.name,
      handle: input.handle,
      logo: input.logo_url,
    })

    const vendorAdminData = transform({
      input,
      vendor,
    }, (data) => {
      return {
        ...data.input.admin,
        vendor_id: data.vendor.id,
      }
    })

    const vendorAdmin = createVendorAdminStep(vendorAdminData)

    setAuthAppMetadataStep({
      authIdentityId: input.authIdentityId,
      actorType: "vendor",
      value: vendorAdmin.id,
    })

    // @ts-ignore
    const { data: vendorWithAdmin } = useQueryGraphStep({
      entity: "vendor",
      fields: ["id", "name", "handle", "logo", "admins.*"],
      filters: {
        id: vendor.id,
      },
    })

    return new WorkflowResponse({
      vendor: vendorWithAdmin[0],
    })
  }
)
