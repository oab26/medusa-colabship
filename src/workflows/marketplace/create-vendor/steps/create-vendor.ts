import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MARKETPLACE_MODULE } from "../../../../modules/marketplace"
import MarketplaceModuleService from "../../../../modules/marketplace/service"

export interface CreateVendorInput {
  handle: string
  name: string
  logo_url?: string
}

export const createVendorStep = createStep(
  "create-vendor",
  async (input: CreateVendorInput, { container }) => {
    const marketplaceModuleService: MarketplaceModuleService = container.resolve(MARKETPLACE_MODULE)

    const vendor = await marketplaceModuleService.createVendors(input)

    return new StepResponse(vendor, vendor.id)
  },
  async (vendorId, { container }) => {
    if (!vendorId) {
      return
    }

    const marketplaceModuleService: MarketplaceModuleService = container.resolve(MARKETPLACE_MODULE)
    await marketplaceModuleService.deleteVendors(vendorId)
  }
)
