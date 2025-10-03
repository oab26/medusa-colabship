import { model } from "@medusajs/framework/utils"
import Vendor from "./vendor"

const VendorAdmin = model.define("vendor_admin", {
  id: model.id().primaryKey(),
  email: model.text().unique(),
  first_name: model.text(),
  last_name: model.text(),
  vendor: model.belongsTo(() => Vendor, { mappedBy: "admins" }),
})

export default VendorAdmin
