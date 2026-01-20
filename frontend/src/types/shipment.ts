export type ShipmentStatus =
  | "pending"
  | "in_preparation"
  | "shipped"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "delayed"
  | "cancelled"

export interface ShipmentOrder {
  id: string
  orderNumber: string
  trackingNumber: string
  company: string
  clientName: string
  product: string
  carrier: string
  status: ShipmentStatus
  destination: string
  weightKg: number
  createdAt: string
  shippedAt?: string
  estimatedDelivery?: string
  deliveredAt?: string
  lastCheckpoint: string
  contractRef?: string
}
