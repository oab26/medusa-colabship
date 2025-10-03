import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { MARKETPLACE_MODULE } from "../../../../modules/marketplace"
import MarketplaceModuleService from "../../../../modules/marketplace/service"

export interface CreateVendorAdminInput {
  email: string
  first_name?: string
  last_name?: string
  vendor_id: string
}

export interface VendorAdminOutput {
  id: string
  email: string
  auth_identity_id: string
}

export const createVendorAdminStep = createStep(
  "create-vendor-admin",
  async (input: CreateVendorAdminInput, { container }) => {
    const marketplaceModuleService: MarketplaceModuleService = container.resolve(MARKETPLACE_MODULE)

    const vendorAdmin = await marketplaceModuleService.createVendorAdmins(input)

    const result: VendorAdminOutput = {
      id: vendorAdmin.id,
      email: vendorAdmin.email,
      auth_identity_id: "", // Will be set by setAuthAppMetadataStep
    }

    return new StepResponse(result, vendorAdmin.id)
  },
  async (vendorAdminId, { container }) => {
    if (!vendorAdminId) {
      return
    }

    const marketplaceModuleService: MarketplaceModuleService = container.resolve(MARKETPLACE_MODULE)
    await marketplaceModuleService.deleteVendorAdmins(vendorAdminId)
  }
)
