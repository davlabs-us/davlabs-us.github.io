export const drugs = ['Marijuana', 'Cocaine', 'Heroin'] as const;
export type Drug = typeof drugs[number];
export interface PurchasableAsset {
    id: string;
    name: string;
    price: number;
    city: number;
}
export interface Vehicle extends PurchasableAsset {
    cargoCapacity: number;
}
export interface Property extends PurchasableAsset {
    kind: 'house' | 'business';
    rent: number;
}
export const vehicles: Vehicle[] = [
    { id: 'starter', name: 'Rusty hatchback', price: 0, cargoCapacity: 16, city: -1 },
    { id: 'subaru', name: 'Subaru', price: 650, cargoCapacity: 24, city: 0 },
    { id: 'tesla', name: 'Tesla', price: 1200, cargoCapacity: 36, city: 1 },
    { id: 'bmw', name: 'BMW M3', price: 1800, cargoCapacity: 48, city: 2 },
    { id: 'jeep', name: 'Jeep Wrangler', price: 2800, cargoCapacity: 60, city: 3 },
    { id: 'cadillac', name: 'Cadillac CT5', price: 4200, cargoCapacity: 72, city: 4 },
    { id: 'porsche', name: 'Porsche 911', price: 6200, cargoCapacity: 90, city: 5 },
    { id: 'rivian', name: 'Rivian R1T', price: 8500, cargoCapacity: 110, city: 6 },
    { id: 'ferrari', name: 'Ferrari F8', price: 11500, cargoCapacity: 135, city: 7 }
];
export const cities = [
    { name: 'Portland', state: 'OREGON', tag: 'PINE TREES. SMALL DEALS. BIG PLANS.', color: 0x8db9a0, sky: 0x9ab6b3, mapX: 232, mapY: 183 },
    { name: 'San Francisco', state: 'CALIFORNIA', tag: 'NEW HILLS. HIGHER STAKES.', color: 0xe1ad7d, sky: 0xb3cad0, mapX: 190, mapY: 290 },
    { name: 'Los Angeles', state: 'CALIFORNIA', tag: 'SUNSHINE AT THE END OF THE ROAD.', color: 0xe7c782, sky: 0xdec69f, mapX: 253, mapY: 372 },
    { name: 'Salt Lake City', state: 'UTAH', tag: 'MOUNTAIN AIR. OPEN ROADS.', color: 0xc3a77b, sky: 0xc1d1d6, mapX: 385, mapY: 245 },
    { name: 'Chicago', state: 'ILLINOIS', tag: 'LAKEFRONT LIGHTS. BIG CITY DEALS.', color: 0x8ba5c4, sky: 0x9fb9cc, mapX: 675, mapY: 222 },
    { name: 'New York City', state: 'NEW YORK', tag: 'TALL BUILDINGS. BIG AMBITIONS.', color: 0xe8ba54, sky: 0xc3b6b3, mapX: 857, mapY: 229 },
    { name: 'Austin', state: 'TEXAS', tag: 'LIVE MUSIC. NEW OPPORTUNITIES.', color: 0xd7a36b, sky: 0xe2cab0, mapX: 550, mapY: 400 },
    { name: 'Miami', state: 'FLORIDA', tag: 'OCEAN BREEZE. ONE LAST BIG DEAL.', color: 0xf2a5bc, sky: 0xa8d9dc, mapX: 815, mapY: 444 }
];
const houseNames = ['Pine Street Home', 'Sunset Row House', 'Palm Grove Home', 'Mountain View Home', 'Lakefront Home', 'Brooklyn Brownstone', 'Barton Springs Home', 'Biscayne Beach House'];
const businessNames = ['Rose City Cafe', 'Bay Laundromat', 'Sunset Diner', 'Wasatch Books', 'Windy City Pizza', 'Empire Deli', 'Sixth Street Records', 'Ocean Drive Cafe'];
const housePrices = [900, 1400, 1800, 2200, 3000, 4000, 5200, 6800];
const businessPrices = [700, 1000, 1300, 1700, 2200, 2800, 3600, 4600];
const businessRents = [40, 55, 70, 90, 120, 150, 190, 240];
export const properties: Property[] = cities.flatMap((_, city) => [
    { id: `house-${city}`, name: houseNames[city], price: housePrices[city], city, kind: 'house', rent: 0 },
    { id: `business-${city}`, name: businessNames[city], price: businessPrices[city], city, kind: 'business', rent: businessRents[city] }
]);
