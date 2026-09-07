export interface ICreateParcelPayload {
  parcelType: "DOCUMENT" | "PACKAGE" | "FRAGILE" | "ELECTRONICS" | "OTHER";
  description?: string;
  weightKg: number;

  pickupAddress: string;
  pickupLat?: number;
  pickupLng?: number;

  deliveryAddress: string;
  deliveryLat?: number;
  deliveryLng?: number;

  receiverName: string;
  receiverPhone: string;
}

export interface IUpdateParcelPayload {
  description?: string;
  pickupAddress?: string;
  deliveryAddress?: string;
  receiverName?: string;
  receiverPhone?: string;
}

export interface IUpdateParcelStatusPayload {
  status:
    | "APPROVED"
    | "ASSIGNED"
    | "PICKED_UP"
    | "IN_TRANSIT"
    | "DELIVERED"
    | "CANCELLED"
    | "FAILED";
  note?: string;
}

export interface IAssignCourierPayload {
  courierId: string;
}

export interface IParcelFilters {
  status?: string;
  parcelType?: string;
  searchTerm?: string;
}
