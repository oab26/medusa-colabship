import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { MARKETPLACE_MODULE } from "../../../../modules/marketplace"
import MarketplaceModuleService from "../../../../modules/marketplace/service"

export interface CreateVendorAdminInput {
  vendorId: string
  email: string
  password: string
  first_name: string
  last_name: string
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
    const authModuleService = container.resolve(Modules.AUTH)

    const vendorAdmin = await marketplaceModuleService.createVendorAdmins({
      email: input.email,
      first_name: input.first_name,
      last_name: input.last_name,
      vendor_id: input.vendorId,
    })

    const authIdentity = await authModuleService.createAuthIdentities({
      provider_identities: [{
        provider: "emailpass",
        entity_id: input.email,
      }],
      app_metadata: {
        user_id: vendorAdmin.id,
      },
    })

    const result: VendorAdminOutput = {
      id: vendorAdmin.id,
      email: vendorAdmin.email,
      auth_identity_id: authIdentity.id,
    }

    return new StepResponse(result, {
      vendorAdminId: vendorAdmin.id,
      authIdentityId: authIdentity.id,
    })
  },
  async (rollbackData, { container }) => {
    if (!rollbackData) {
      return
    }

    const marketplaceModuleService: MarketplaceModuleService = container.resolve(MARKETPLACE_MODULE)
    const authModuleService = container.resolve(Modules.AUTH)

    if (rollbackData.authIdentityId) {
      await authModuleService.deleteAuthIdentities([rollbackData.authIdentityId])
    }

    if (rollbackData.vendorAdminId) {
      await marketplaceModuleService.deleteVendorAdmins(rollbackData.vendorAdminId)
    }
  }
)
