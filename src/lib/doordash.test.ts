import { describe, it, expect } from 'vitest'
import { orderTotalMiles, orderFuelCost, sessionFuelCost, odoCost } from './doordash'

describe('orderTotalMiles', () => {
  it('returns delivery miles when there is no pickup', () => {
    expect(orderTotalMiles(5.2, null)).toBe(5.2)
  })

  it('sums delivery and pickup miles', () => {
    expect(orderTotalMiles(5.2, 1.8)).toBeCloseTo(7.0)
  })

  it('treats zero pickup miles as zero', () => {
    expect(orderTotalMiles(3.0, 0)).toBe(3.0)
  })
})

describe('orderFuelCost', () => {
  it('calculates cost for a delivery-only order', () => {
    // 10 miles / 30 mpg * $3.00/gal = $1.00
    expect(orderFuelCost(10, null, 30, 3.0)).toBeCloseTo(1.0)
  })

  it('includes pickup miles in the cost', () => {
    // (10 + 5) miles / 30 mpg * $3.00/gal = $1.50
    expect(orderFuelCost(10, 5, 30, 3.0)).toBeCloseTo(1.5)
  })

  it('scales with gas price', () => {
    const cheap = orderFuelCost(10, null, 30, 3.0)
    const expensive = orderFuelCost(10, null, 30, 4.5)
    expect(expensive).toBeCloseTo(cheap * 1.5)
  })

  it('scales inversely with mpg', () => {
    // Better MPG = lower cost
    const lowMpg = orderFuelCost(10, null, 20, 3.0)
    const highMpg = orderFuelCost(10, null, 40, 3.0)
    expect(highMpg).toBeCloseTo(lowMpg / 2)
  })
})

describe('sessionFuelCost', () => {
  it('returns 0 for an empty session', () => {
    expect(sessionFuelCost([], 30, 3.0)).toBe(0)
  })

  it('sums cost across multiple orders', () => {
    const orders = [
      { deliveryMiles: 10, pickupMiles: null },
      { deliveryMiles: 5, pickupMiles: 2 },
    ]
    // order 1: 10/30 * 3 = 1.00
    // order 2: 7/30 * 3 = 0.70
    expect(sessionFuelCost(orders, 30, 3.0)).toBeCloseTo(1.7)
  })

  it('applies the same mpg and gasPrice to all orders', () => {
    const orders = [
      { deliveryMiles: 6, pickupMiles: null },
      { deliveryMiles: 6, pickupMiles: null },
      { deliveryMiles: 6, pickupMiles: null },
    ]
    const single = orderFuelCost(6, null, 32, 3.5)
    expect(sessionFuelCost(orders, 32, 3.5)).toBeCloseTo(single * 3)
  })
})

describe('odoCost', () => {
  it('calculates cost from odometer readings', () => {
    // 50 miles / 25 mpg * $4.00/gal = $8.00
    expect(odoCost(45000, 45050, 25, 4.0)).toBeCloseTo(8.0)
  })

  it('returns 0 when start and end odometer are equal', () => {
    expect(odoCost(45000, 45000, 30, 3.5)).toBe(0)
  })
})
