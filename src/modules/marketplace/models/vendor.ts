import { model } from "@medusajs/framework/utils"

const Vendor = model.define("vendor", {
  id: model.id().primaryKey(),
  handle: model.text().unique(),
  name: model.text(),
  logo_url: model.text().nullable(),
})

export default Vendor
