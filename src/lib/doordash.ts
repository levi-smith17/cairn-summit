/**
 * Pure utility functions for Doordash fuel calculations.
 * Kept separate so they can be unit-tested without React or Prisma.
 */

export function orderTotalMiles(deliveryMiles: number, pickupMiles: number | null): number {
  return deliveryMiles + (pickupMiles ?? 0)
}

export function orderFuelCost(
  deliveryMiles: number,
  pickupMiles: number | null,
  mpg: number,
  gasPrice: number,
): number {
  return (orderTotalMiles(deliveryMiles, pickupMiles) / mpg) * gasPrice
}

export function sessionFuelCost(
  orders: { deliveryMiles: number; pickupMiles: number | null }[],
  mpg: number,
  gasPrice: number,
): number {
  return orders.reduce((sum, o) => sum + orderFuelCost(o.deliveryMiles, o.pickupMiles, mpg, gasPrice), 0)
}

export function odoCost(startOdometer: number, endOdometer: number, mpg: number, gasPrice: number): number {
  return ((endOdometer - startOdometer) / mpg) * gasPrice
}
