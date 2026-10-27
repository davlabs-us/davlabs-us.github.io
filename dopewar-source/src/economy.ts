import { cities, drugs, vehicles, properties, type Drug } from './data.ts';
export interface State {
    version: 1;
    city: number;
    cash: number;
    inventory: Record<Drug, number>;
    vehicle: number;
    completed: number[];
    unlocked: number[];
    assets: string[];
    markets: number[][];
    marketEpoch: number;
    screen: 'map' | 'city';
    x: number;
}
function market(city: number): number[] {
    return [50, 110, 180].map(p => Math.round(p * (1 + city * .35) * (.9 + Math.random() * .2)));
}
export function fresh(): State {
    return { version: 1, city: 0, cash: 1500, inventory: { Marijuana: 0, Cocaine: 0, Heroin: 0 }, vehicle: 0, completed: [], unlocked: [0], assets: ['starter'], markets: cities.map((_, i) => market(i)), marketEpoch: Date.now(), screen: 'map', x: 110 };
}
export function cargo(s: State) { return drugs.reduce((n, d) => n + s.inventory[d], 0); }
export function price(s: State, d: Drug, now = Date.now()) {
    const phase = Math.floor((now - s.marketEpoch) / 10000) % 2;
    return Math.round(s.markets[s.city][drugs.indexOf(d)] * (phase ? 2.4 : 1));
}
// Keep enough cash to buy at least one low-market unit in the next city.
export function workingCash(s: State) {
    const destination = Math.min(s.city + 1, cities.length - 1);
    return Math.max(100, Math.min(...s.markets[destination]));
}
export function trade(s: State, d: Drug, buy: boolean, quantity = 1, now = Date.now()) {
    if (!Number.isInteger(quantity) || quantity < 1)
        return false;
    const cost = price(s, d, now) * quantity;
    if (buy) {
        if (s.cash < cost || cargo(s) + quantity > vehicles[s.vehicle].cargoCapacity)
            return false;
        s.cash -= cost;
        s.inventory[d] += quantity;
    }
    else {
        if (s.inventory[d] < quantity)
            return false;
        s.cash += cost;
        s.inventory[d] -= quantity;
    }
    return true;
}
export function purchase(s: State) {
    const next = s.city + 1;
    const v = vehicles[next];
    if (!v || s.vehicle !== s.city || s.cash < v.price + workingCash(s))
        return false;
    s.cash -= v.price;
    s.vehicle = next;
    s.completed.push(s.city);
    s.assets.push(v.id);
    if (next < cities.length && !s.unlocked.includes(next))
        s.unlocked.push(next);
    return true;
}
export function purchaseProperty(s: State, id: string) {
    const asset = properties.find(p => p.id === id);
    if (!asset || s.screen !== 'city' || asset.city !== s.city || s.assets.includes(id)
        || s.cash < asset.price + workingCash(s))
        return false;
    s.cash -= asset.price;
    s.assets.push(id);
    return true;
}
// A visit is a map → city transition. Reloading or opening a shop is not a visit.
export function visitCity(s: State, city: number): number | null {
    if (s.screen !== 'map' || !Number.isInteger(city) || !s.unlocked.includes(city)
        || city < 0 || city >= cities.length)
        return null;
    const rent = properties.filter(p => p.city === city && p.kind === 'business' && s.assets.includes(p.id))
        .reduce((sum, p) => sum + p.rent, 0);
    s.city = city;
    s.screen = 'city';
    s.x = 110;
    s.cash += rent;
    return rent;
}
export function valid(s: unknown): s is State {
    if (!s || typeof s !== 'object')
        return false;
    const a = s as State;
    const cityIndex = (c: number) => Number.isInteger(c) && c >= 0 && c < cities.length;
    return a.version === 1 && cityIndex(a.city) && Number.isInteger(a.vehicle) && a.vehicle >= 0 && a.vehicle < vehicles.length
        && Number.isFinite(a.cash) && a.cash >= 0
        && drugs.every(d => Number.isInteger(a.inventory?.[d]) && a.inventory[d] >= 0)
        && Array.isArray(a.unlocked) && a.unlocked.includes(a.city) && a.unlocked.every(cityIndex)
        && Array.isArray(a.completed) && a.completed.every(cityIndex) && Array.isArray(a.assets) && a.assets.every(id => typeof id === 'string') && new Set(a.assets).size === a.assets.length
        && Array.isArray(a.markets) && a.markets.length === cities.length
        && a.markets.every(m => Array.isArray(m) && m.length === drugs.length && m.every(p => Number.isFinite(p) && p > 0))
        && Number.isFinite(a.marketEpoch) && Number.isFinite(a.x) && (a.screen === 'map' || a.screen === 'city')
        && cargo(a) <= vehicles[a.vehicle].cargoCapacity;
}
// Extend earlier routes while preserving existing market prices, cargo, and ownership.
export function restore(value: unknown): State | null {
    if (!value || typeof value !== 'object')
        return null;
    const s = structuredClone(value) as State;
    if (Array.isArray(s.markets) && [3, 6].includes(s.markets.length)) {
        const previousCount = s.markets.length;
        s.markets.push(...cities.slice(previousCount).map((_, i) => market(i + previousCount)));
    }
    if (!valid(s))
        return null;
    for (const city of s.completed) {
        if (city + 1 < cities.length && !s.unlocked.includes(city + 1))
            s.unlocked.push(city + 1);
    }
    return s;
}
