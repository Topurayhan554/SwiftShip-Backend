import { ParcelStatus } from "../../../generated/prisma/enums";

export const ALLOWED_STATUS_TRANSITIONS: Record<ParcelStatus, ParcelStatus[]> =
  {
    [ParcelStatus.PENDING]: [ParcelStatus.APPROVED, ParcelStatus.CANCELLED],
    [ParcelStatus.APPROVED]: [ParcelStatus.ASSIGNED, ParcelStatus.CANCELLED],
    [ParcelStatus.ASSIGNED]: [ParcelStatus.PICKED_UP, ParcelStatus.CANCELLED],
    [ParcelStatus.PICKED_UP]: [ParcelStatus.IN_TRANSIT, ParcelStatus.FAILED],
    [ParcelStatus.IN_TRANSIT]: [ParcelStatus.DELIVERED, ParcelStatus.FAILED],
    [ParcelStatus.DELIVERED]: [],
    [ParcelStatus.CANCELLED]: [],
    [ParcelStatus.FAILED]: [],
  };

export const PARCEL_SEARCHABLE_FIELDS = [
  "trackingId",
  "receiverName",
  "receiverPhone",
];
