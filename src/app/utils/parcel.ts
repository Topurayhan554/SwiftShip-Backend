export const generateTrackingId = (): string => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `SS-${datePart}-${randomPart}`;
};

export const calculateParcelFee = (weightKg: number): number => {
  const BASE_FEE = 60;
  const PER_KG_RATE = 15; 

  const fee = BASE_FEE + weightKg * PER_KG_RATE;
  return Math.round(fee * 100) / 100;
};
