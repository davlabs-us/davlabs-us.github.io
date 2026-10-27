import Phaser from 'phaser';
import './style.css';
import { cities, drugs, vehicles, properties, type Property } from './data.ts';
import { fresh, restore, cargo, price, trade, purchase, purchaseProperty, visitCity, workingCash, type State } from './economy.ts';
const key = 'drug-wars-v1';
let state: State = fresh();
try {
    const saved = restore(JSON.parse(localStorage.getItem(key) || 'null'));
    if (saved)
        state = saved;
}
catch { }
const overlay = document.querySelector<HTMLDivElement>('#overlay')!;
let modal = '';
let message = '';
let saveFailed = false;
function save() {
    try {
        localStorage.setItem(key, JSON.stringify(state));
    }
    catch {
        saveFailed = true;
    }
    hud();
}
function hud() { document.querySelector('#hud')!.innerHTML = `<div><small>HEALTH</small><span class="health">▰▰▰▰▰</span></div><div><small>CASH</small>$${state.cash.toLocaleString()}</div><div><small>CARGO</small>${cargo(state)} <span class="muted">/ ${vehicles[state.vehicle].cargoCapacity}</span></div><div><small>YOUR RIDE</small>${vehicles[state.vehicle].name}</div><div><small>LOCATION</small>${cities[state.city].name}</div>`; document.querySelector('footer span:last-child')!.innerHTML = saveFailed ? 'SAVE UNAVAILABLE' : 'LOCAL SAVE <i>●</i>'; }
function close() { modal = ''; overlay.className = ''; overlay.innerHTML = ''; game.canvas.focus(); }
function panel(content: string) { overlay.className = 'active'; overlay.innerHTML = `<section class="panel">${content}</section>`; }
let toastTimer: ReturnType<typeof setTimeout>;
function toast(text: string) {
    let notice = document.querySelector<HTMLDivElement>('#toast');
    if (!notice) {
        notice = document.createElement('div');
        notice.id = 'toast';
        document.querySelector('main')!.append(notice);
    }
    clearTimeout(toastTimer);
    notice.textContent = text;
    notice.classList.add('visible');
    toastTimer = setTimeout(() => notice!.classList.remove('visible'), 4500);
}
function menu() { modal = 'menu'; panel(`<div class="eyebrow">EIGHT CITIES. ONE COAST TO COAST RUN.</div><h1>Start small.<br>Leave with more.</h1><p>Trade the market. Upgrade your ride. Buy homes and rent-paying businesses. Work your way from Portland through Austin to Miami.</p><p><b>← → / A D</b> walk &nbsp; <b>E</b> enter &nbsp; <b>Esc</b> close<br>Walk to the freeway exit to return to the map.</p><div class="actions"><button id="continue">${state.screen === 'city' ? 'CONTINUE ON THE STREET' : 'EXPLORE THE MAP'} →</button><button class="secondary" id="reset">NEW RUN</button></div><p class="muted">~6–8 MINUTE ROUTE · OPTIONAL PROPERTY · AUTO SAVED · DESKTOP KEYBOARD</p>`); document.querySelector('#continue')!.addEventListener('click', close); document.querySelector('#reset')!.addEventListener('click', () => { panel('<h2>Start a new run?</h2><p>This replaces your saved cash, cargo, and city progress.</p><div class="actions"><button id="yes">START FRESH</button><button class="secondary" id="no">KEEP MY RUN</button></div>'); document.querySelector('#no')!.addEventListener('click', menu); document.querySelector('#yes')!.addEventListener('click', () => { state = fresh(); save(); close(); game.scene.start('world'); }); }); }
class World extends Phaser.Scene {
    g!: Phaser.GameObjects.Graphics;
    person!: Phaser.GameObjects.Container;
    cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    keys!: Record<string, Phaser.Input.Keyboard.Key>;
    walking = 0;
    exitLock = false;
    constructor() { super('world'); }
    create() {
        this.g = this.add.graphics();
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.keys = this.input.keyboard!.addKeys('A,D,E,ESC') as Record<string, Phaser.Input.Keyboard.Key>;
        this.input.keyboard!.on('keydown-E', (event: KeyboardEvent) => {
            if (event.repeat || modal || state.screen !== 'city' || !this.person)
                return;
            if (Math.abs(this.person.x - 365) < 85)
                openShop();
            else if (Math.abs(this.person.x - 835) < 95)
                openDealer();
            else if (Math.abs(this.person.x - 615) < 60)
                openProperty('house');
            else if (Math.abs(this.person.x - 1120) < 75)
                openProperty('business');
        });
        this.input.keyboard!.on('keydown-ESC', () => {
            if (modal)
                close();
            else
                menu();
        });
        if (state.screen === 'city')
            this.city();
        else
            this.map();
        hud();
    }
    label(x: number, y: number, t: string, size = 16, color = '#e6ecda') { return this.add.text(x, y, t, { fontFamily: 'Space Mono, monospace', fontSize: size, color }); }
    rect(x: number, y: number, w: number, h: number, c: number) { this.g.fillStyle(c); this.g.fillRect(x, y, w, h); }
    car(x: number, y: number, color = 0xc4ed76) { this.rect(x - 22, y - 12, 44, 16, color); this.rect(x - 12, y - 22, 25, 12, color); this.rect(x - 9, y - 20, 19, 8, 0x36505b); this.g.fillStyle(0x142328); this.g.fillCircle(x - 13, y + 4, 6); this.g.fillCircle(x + 14, y + 4, 6); }
    map() {
        this.cameras.main.setBounds(0, 0, 1100, 620);
        this.rect(0, 0, 1100, 620, 0x19343e);
        for (let x = 0; x < 1100; x += 35)
            for (let y = 0; y < 620; y += 35) {
                this.g.fillStyle(0x24434a);
                this.g.fillCircle(x, y, 1);
            }
        this.label(45, 32, 'THE COAST TO COAST RUN', 12, '#c4ed76');
        this.label(45, 57, 'Choose your next stop.', 26);
        this.label(45, 573, `01 — ${String(cities.length).padStart(2, '0')}    /    USA OVERWORLD`, 10, '#93aaa4');
        const points = [210, 120, 330, 128, 430, 142, 510, 145, 565, 128, 610, 139, 660, 147, 695, 127, 731, 135, 750, 161, 790, 175, 810, 151, 860, 146, 898, 123, 922, 136, 912, 180, 872, 206, 875, 231, 845, 254, 813, 265, 807, 295, 781, 317, 783, 357, 809, 397, 831, 436, 815, 460, 796, 420, 765, 389, 715, 390, 677, 405, 628, 394, 589, 415, 568, 445, 543, 463, 516, 450, 499, 410, 475, 396, 440, 384, 403, 385, 379, 365, 340, 367, 312, 386, 281, 380, 256, 352, 231, 319, 212, 289, 194, 250, 188, 213, 204, 184];
        this.g.fillStyle(0x4b7060);
        this.g.fillPoints(Array.from({ length: points.length / 2 }, (_, i) => new Phaser.Geom.Point(points[i * 2], points[i * 2 + 1])), true);
        this.g.lineStyle(3, 0x7d9a70);
        this.g.strokePoints(Array.from({ length: points.length / 2 }, (_, i) => new Phaser.Geom.Point(points[i * 2], points[i * 2 + 1])), true);
        for (let i = 0; i < 28; i++) {
            const x = 330 + (i * 47) % 440, y = 190 + (i * 29) % 170;
            this.g.fillStyle(0x66816a, .5);
            this.g.fillTriangle(x, y, x - 6, y + 13, x + 6, y + 13);
        }
        this.label(465, 275, 'U N I T E D   S T A T E S', 13, '#b0c39b');
        this.label(95, 423, 'PACIFIC\nOCEAN', 10, '#6f969d');
        this.g.lineStyle(3, 0xc4ed76, .55);
        this.g.beginPath();
        cities.forEach((city, index) => {
            if (index === 0)
                this.g.moveTo(city.mapX, city.mapY);
            else
                this.g.lineTo(city.mapX, city.mapY);
        });
        this.g.strokePath();
        cities.forEach((c, i) => {
            const unlocked = state.unlocked.includes(i), done = state.completed.includes(i);
            this.g.fillStyle(unlocked ? 0xc4ed76 : 0x57706a);
            this.g.fillCircle(c.mapX, c.mapY, 10);
            this.g.lineStyle(2, 0x132e32);
            this.g.strokeCircle(c.mapX, c.mapY, 10);
            const labelX = i === 7 ? c.mapX - 180 : c.mapX + 20;
            const text = this.label(labelX, c.mapY - (i >= 3 ? 32 : 10), c.name.toUpperCase(), 14, unlocked ? '#f0f4df' : '#a0b2a6');
            this.label(labelX, c.mapY + 12, done ? '✓ COMPLETED' : unlocked ? 'ENTER CITY →' : 'LOCKED · ' + vehicles[i].name.toUpperCase(), 9, unlocked ? '#c4ed76' : '#a0b2a6');
            if (unlocked) {
                const hit = this.add.zone(i === 7 ? labelX : c.mapX - 14, c.mapY - (i >= 3 ? 35 : 17), i === 7 ? 200 : 230, i >= 3 ? 65 : 50).setOrigin(0).setInteractive({ useHandCursor: true });
                hit.on('pointerdown', () => {
                    if (modal)
                        return;
                    const rent = visitCity(state, i);
                    if (rent === null)
                        return;
                    save();
                    this.scene.restart();
                    if (rent > 0)
                        toast(`RENT COLLECTED +$${rent.toLocaleString()} · ${c.name}`);
                });
                hit.on('pointerover', () => text.setColor('#c4ed76'));
                hit.on('pointerout', () => text.setColor('#f0f4df'));
            }
        });
        const c = cities[state.city];
        this.car(c.mapX - 39, c.mapY - 5);
        this.rect(890, 315, 165, 218, 0x132b31);
        this.label(911, 337, 'YOUR ROUTE', 10, '#c4ed76');
        this.label(911, 364, `${String(cities.length).padStart(2, '0')} CITIES\n${String(vehicles.length - 1).padStart(2, '0')} UPGRADES\n01 FINAL RIDE`, 13);
        this.label(911, 449, state.completed.length === cities.length ? 'RUN COMPLETE ✓' : 'NEXT RIDE', 10, '#92aaa0');
        this.label(911, 476, state.completed.length === cities.length ? vehicles.at(-1)!.name : vehicles[Math.min(state.vehicle + 1, vehicles.length - 1)].name, 18);
        document.querySelector('#hint')!.textContent = 'CLICK AN UNLOCKED CITY · MENU FOR A NEW RUN';
    }
    ground(x: number) { return state.city === 1 ? 480 - 40 * Math.sin(x / 240) : 480; }
    tree(x: number, palm = false) {
        const y = this.ground(x);
        this.rect(x, y - 105, 7, 105, 0x685d43);
        this.g.fillStyle(palm ? 0x648754 : 0x3e7257);
        if (palm) {
            for (let j = 0; j < 5; j++)
                this.g.fillEllipse(x + 3 + Math.cos(j * 1.3) * 20, y - 110 + Math.sin(j * 1.3) * 8, 65, 12);
        }
        else {
            this.g.fillTriangle(x + 3, y - 158, x - 28, y - 75, x + 34, y - 75);
            this.g.fillTriangle(x + 3, y - 120, x - 33, y - 40, x + 39, y - 40);
        }
    }
    city() {
        const c = cities[state.city];
        this.cameras.main.setBounds(0, 0, 1560, 620);
        this.rect(0, 0, 1560, 620, c.sky);
        this.g.fillStyle(state.city === 2 ? 0xf6e3a9 : 0xc9dad1);
        this.g.fillCircle(1230, 90, 45);
        // Small scenery changes give each new stop its own silhouette.
        if (state.city === 3) {
            for (let i = 0; i < 5; i++) {
                const x = i * 360 - 80;
                this.g.fillStyle(0x899baa);
                this.g.fillTriangle(x, 390, x + 200, 120 + i % 2 * 35, x + 440, 390);
                this.g.fillStyle(0xe4ebe6);
                this.g.fillTriangle(x + 143, 195 + i % 2 * 35, x + 200, 120 + i % 2 * 35, x + 264, 195 + i % 2 * 35);
            }
        }
        if (state.city === 4) {
            this.rect(0, 335, 1560, 145, 0x6a9dae);
            for (let x = 0; x < 1560; x += 90)
                this.rect(x, 362, 42, 3, 0xa6cbd1);
        }
        if (state.city === 6) {
            // Austin's river and rolling Hill Country.
            this.g.fillStyle(0xa2ad7c);
            for (let x = 0; x < 1560; x += 350)
                this.g.fillEllipse(x + 150, 340, 500, 180);
            this.rect(0, 400, 1560, 80, 0x6caaa4);
        }
        if (state.city === 7) {
            // Miami's oceanfront and pastel skyline.
            this.rect(0, 330, 1560, 150, 0x55b9c4);
            for (let x = 0; x < 1560; x += 100)
                this.rect(x, 385, 55, 3, 0xb7ebdf);
        }
        const dense = [4, 5, 7].includes(state.city);
        const spacing = dense ? 100 : 135;
        const skylineColor = [0x789696, 0x789696, 0x789696, 0xb6ada0, 0x627e91, 0x847e88, 0xaa937b, 0xa28da7][state.city];
        for (let i = 0; i < Math.ceil(1560 / spacing); i++) {
            const x = i * spacing;
            const top = dense ? 140 - i % 4 * 22 : 225 - i % 3 * 25;
            this.rect(x, top, dense ? 90 : 110, 480 - top, skylineColor);
            for (let y = top + 20; y < 425; y += 45) {
                for (let j = 0; j < 4; j++)
                    this.rect(x + 12 + j * 20, y, 8, dense ? 18 : 30, dense ? 0xd0c6a5 : 0x9db5b1);
            }
            if (state.city === 4 && i % 4 === 1)
                this.rect(x + 40, top - 40, 4, 40, skylineColor);
            if (state.city === 5 && i % 3 === 0) {
                this.rect(x + 25, top - 35, 35, 28, 0x5e5253);
                this.rect(x + 28, top - 7, 4, 7, 0x463f47);
                this.rect(x + 53, top - 7, 4, 7, 0x463f47);
                this.g.fillStyle(0x5e5253);
                this.g.fillTriangle(x + 20, top - 35, x + 42, top - 48, x + 65, top - 35);
            }
        }
        for (let x = 0; x < 1560; x += 4)
            this.rect(x, this.ground(x), 4, 620 - this.ground(x), 0x37484b);
        for (let x = 0; x < 1560; x += 80)
            this.rect(x, this.ground(x) + 65, 40, 3, 0xb2b5a0);
        if (state.city < 4 || state.city >= 6)
            [80, 510, 910, 1220, 1500].forEach(x => this.tree(x, state.city === 2 || state.city === 7));
        else {
            // Chicago's elevated rail and New York's fire escapes are scenery only.
            if (state.city === 4) {
                for (let x = 50; x < 1560; x += 260)
                    this.rect(x, 286, 9, 194, 0x435c68);
                this.rect(0, 278, 1560, 12, 0x435c68);
                this.rect(960, 239, 210, 38, 0xa8bdc2);
                for (let x = 975; x < 1170; x += 35)
                    this.rect(x, 246, 23, 18, 0x385663);
            }
            else {
                for (let x = 30; x < 1560; x += 300) {
                    for (let y = 215; y < 400; y += 60) {
                        this.rect(x, y, 60, 5, 0x453f47);
                        this.rect(x + 15, y, 4, 60, 0x453f47);
                    }
                }
                this.car(1050, 510, 0xe8ba54);
                this.car(550, 530, 0xe8ba54);
            }
        }
        this.building(220, 210, 'CORNER MARKET', 'DRUG TRADING', [0x385c52, 0x385c52, 0x385c52, 0x786a57, 0x4d657b, 0x785d59, 0x8c6748, 0x498c8a][state.city]);
        this.building(690, 245, 'MOTOR CO.', 'VEHICLE DEALERSHIP', 0x535e66);
        this.car(850, this.ground(850) - 35, c.color);
        this.propertyBuilding(properties.find(p => p.city === state.city && p.kind === 'house')!, 470, 185);
        this.propertyBuilding(properties.find(p => p.city === state.city && p.kind === 'business')!, 975, 230);
        this.rect(1330, this.ground(1330) - 145, 7, 145, 0x738175);
        this.rect(1260, this.ground(1330) - 145, 165, 55, 0x355c48);
        this.label(1275, this.ground(1330) - 132, 'FREEWAY →', 18);
        this.label(1277, this.ground(1330) - 109, 'RETURN TO USA MAP', 9);
        this.label(28, 25, c.name.toUpperCase(), 28, '#203d3a').setScrollFactor(0);
        this.label(29, 67, c.tag, 10, '#355550').setScrollFactor(0);
        this.person = this.add.container(state.x, this.ground(state.x));
        const art = this.add.graphics();
        art.fillStyle(0x1c2a31);
        art.fillRect(-8, -29, 7, 29);
        art.fillRect(2, -29, 7, 29);
        art.fillStyle(0xc4ed76);
        art.fillRect(-11, -53, 23, 27);
        art.fillStyle(0xd5ad87);
        art.fillRect(-7, -69, 15, 16);
        art.fillStyle(0x23373a);
        art.fillRect(-8, -73, 17, 8);
        art.fillStyle(0xd5ad87);
        art.fillRect(-15, -50, 5, 22);
        art.fillRect(12, -50, 5, 22);
        this.person.add(art);
        this.cameras.main.startFollow(this.person, true, .12, 1);
        this.cameras.main.setFollowOffset(0, this.ground(state.x) - 310);
        this.exitLock = false;
        document.querySelector('#hint')!.textContent = '← → / A D  WALK     E  ENTER     WALK RIGHT TO THE FREEWAY EXIT';
    }
    building(x: number, w: number, name: string, sub: string, color: number) { const y = this.ground(x + w / 2); this.rect(x, y - 205, w, 205, color); this.rect(x - 7, y - 209, w + 14, 13, 0x263e3d); this.rect(x + 14, y - 175, w - 28, 44, 0x1e3535); this.label(x + 24, y - 164, name, 17, '#d7e3bc'); this.label(x + 25, y - 139, sub, 8, '#99b5a0'); this.rect(x + 30, y - 105, 65, 65, 0x87aaa0); this.rect(x + 118, y - 99, 54, 99, 0x223b38); this.rect(x + 159, y - 48, 4, 4, 0xdbeaaa); this.label(x + 120, y - 30, '[ E ]', 11, '#c4ed76'); }
    propertyBuilding(asset: Property, x: number, width: number) {
        const owned = state.assets.includes(asset.id);
        const isHouse = asset.kind === 'house';
        this.building(x, width, isHouse ? 'HOUSE' : 'BUSINESS', owned ? 'OWNED BY YOU' : 'FOR SALE', isHouse ? 0x9b7964 : 0x547c78);
        const y = this.ground(x + width / 2);
        if (isHouse) {
            this.g.fillStyle(0x53463f);
            this.g.fillTriangle(x - 10, y - 210, x + width / 2, y - 260, x + width + 10, y - 210);
            this.rect(x + width - 45, y - 250, 15, 40, 0x765f52);
        }
        else {
            for (let dx = 15; dx < width - 15; dx += 20) {
                this.rect(x + dx, y - 124, 20, 16, dx % 40 === 15 ? 0xc4ed76 : 0xe6e9c8);
            }
        }
        this.label(x + 20, y - 14, owned ? (isHouse ? 'HOME SWEET HOME' : `RENT +$${asset.rent} / VISIT`) : `$${asset.price.toLocaleString()} TO OWN`, 9, owned ? '#c4ed76' : '#e6e9c8');
    }
    update(_time: number, delta: number) {
        if (state.screen !== 'city' || !this.person || modal)
            return;
        const left = this.cursors.left.isDown || this.keys.A.isDown, right = this.cursors.right.isDown || this.keys.D.isDown;
        const direction = Number(right) - Number(left);
        this.person.x = Phaser.Math.Clamp(this.person.x + direction * 300 * Math.min(delta, 50) / 1000, 35, 1480);
        this.person.y = this.ground(this.person.x);
        this.cameras.main.setFollowOffset(0, this.person.y - 310);
        this.walking += delta;
        this.person.scaleX = direction || this.person.scaleX;
        this.person.rotation = direction ? Math.sin(this.walking / 90) * .025 : 0;
        state.x = this.person.x;
        if (direction && Math.floor(_time / 500) !== Math.floor((_time - delta) / 500))
            save();
        const shop = Math.abs(this.person.x - 365) < 85, dealer = Math.abs(this.person.x - 835) < 95;
        const house = Math.abs(this.person.x - 615) < 60, business = Math.abs(this.person.x - 1120) < 75;
        document.querySelector('#hint')!.textContent = shop ? 'E  ENTER CORNER MARKET · BUY LOW, SELL HIGH' : dealer ? 'E  ENTER MOTOR CO. · UPGRADE YOUR RIDE' : house ? 'E  ENTER HOUSE · BUY A HOME' : business ? 'E  ENTER BUSINESS · EARN RENT EACH CITY VISIT' : '← → / A D  WALK     E  ENTER     FREEWAY EXIT →';
        if (this.person.x > 1390 && !this.exitLock) {
            this.exitLock = true;
            state.screen = 'map';
            save();
            this.scene.restart();
        }
    }
}
function openShop() { modal = 'shop'; message = ''; renderShop(); }
function renderShop() {
    const seconds = 10 - Math.floor((Date.now() - state.marketEpoch) / 1000) % 10;
    const high = Math.floor((Date.now() - state.marketEpoch) / 10000) % 2;
    panel(`<div class="eyebrow">${cities[state.city].name.toUpperCase()} / CORNER MARKET</div><h2>Make your next move.</h2><p>Market ${high ? 'HIGH · a good time to sell' : 'LOW · a good time to buy'} · changes in ${seconds}s.<br>Buy low, wait for demand, sell high. Prices also vary by city. <b>Shift + click</b> trades the maximum.</p><table class="market"><thead><tr><th>DRUG</th><th>PRICE</th><th>OWNED</th><th>TRADE 1 UNIT</th></tr></thead><tbody>${drugs.map(d => `<tr><td>${d}</td><td>$${price(state, d)}</td><td>${state.inventory[d]}</td><td><button data-drug="${d}" data-buy="true" ${state.cash < price(state, d) || cargo(state) >= vehicles[state.vehicle].cargoCapacity ? 'disabled' : ''}>BUY</button><button class="secondary" data-drug="${d}" data-buy="false" ${!state.inventory[d] ? 'disabled' : ''}>SELL</button></td></tr>`).join('')}</tbody></table><div class="status">${message || `$${state.cash.toLocaleString()} CASH · ${cargo(state)} / ${vehicles[state.vehicle].cargoCapacity} CARGO`}</div><div class="actions"><button class="secondary" id="leave">BACK TO STREET →</button></div>`);
    document.querySelectorAll<HTMLButtonElement>('[data-drug]').forEach(b => b.addEventListener('click', (event) => {
        const d = b.dataset.drug as typeof drugs[number];
        const buy = b.dataset.buy === 'true';
        const unitPrice = price(state, d);
        const quantity = event.shiftKey ? (buy ? Math.min(Math.floor(state.cash / unitPrice), vehicles[state.vehicle].cargoCapacity - cargo(state)) : state.inventory[d]) : 1;
        const cost = unitPrice * quantity;
        if (trade(state, d, buy, quantity)) {
            message = `${buy ? 'Bought' : 'Sold'} ${quantity} ${d} for $${cost}.`;
            save();
        }
        else
            message = 'Trade unavailable. Check cash and cargo.';
        renderShop();
    }));
    document.querySelector('#leave')!.addEventListener('click', close);
}
function openDealer() {
    modal = 'dealer';
    const v = vehicles[state.city + 1], done = state.completed.includes(state.city);
    panel(`<div class="eyebrow">${cities[state.city].name.toUpperCase()} / MOTOR CO.</div><h2>A better ride. A bigger run.</h2><p>Keep $${workingCash(state)} in working cash after purchase for your next trade.</p><div class="vehicle"><strong>${v.name}</strong><p>${v.cargoCapacity} cargo units · $${v.price.toLocaleString()}</p></div><p>${done ? 'You already own this ride. Keep trading or head to the freeway.' : state.city < cities.length - 1 ? `Buy this ride to complete ${cities[state.city].name} and unlock ${cities[state.city + 1].name}.` : `Buy the ${v.name} to complete the coast to coast run.`}</p><div class="status">${done ? 'CITY COMPLETED ✓' : state.cash < v.price + workingCash(state) ? `$${(v.price + workingCash(state) - state.cash).toLocaleString()} more needed. Trade low → high. Keep $${workingCash(state)} working cash.` : `$${state.cash.toLocaleString()} AVAILABLE`}</div><div class="actions"><button id="purchase" ${done || state.cash < v.price + workingCash(state) ? 'disabled' : ''}>BUY ${v.name.toUpperCase()}</button><button class="secondary" id="leave">BACK TO STREET</button></div>`);
    document.querySelector('#leave')!.addEventListener('click', close);
    document.querySelector('#purchase')!.addEventListener('click', () => {
        if (purchase(state)) {
            save();
            panel(`<div class="eyebrow">CITY COMPLETE ✓</div><h1>${state.city === cities.length - 1 ? 'Coast to coast. Conquered.' : 'Keys in hand.'}</h1><p>${v.name} purchased. Cargo upgraded to ${v.cargoCapacity} units.<br>${state.city === cities.length - 1 ? `You completed all ${cities.length} cities. Keep playing and trading.` : `${cities[state.city + 1].name} is now unlocked.`}<br>Walk right to the freeway to return to the map.</p><button id="done">BACK TO STREET →</button>`);
            document.querySelector('#done')!.addEventListener('click', close);
        }
    });
}
function openProperty(kind: Property['kind']) {
    modal = 'property';
    const asset = properties.find(p => p.city === state.city && p.kind === kind)!;
    const owned = state.assets.includes(asset.id);
    const reserve = workingCash(state);
    const canBuy = state.cash >= asset.price + reserve;
    panel(`<div class="eyebrow">${cities[state.city].name.toUpperCase()} / ${kind.toUpperCase()}</div>
        <h2>${asset.name}</h2>
        <div class="vehicle"><strong>${owned ? 'Owned by you' : `$${asset.price.toLocaleString()}`}</strong>
        <p>${kind === 'business' ? `Pays $${asset.rent} rent each time you enter ${cities[state.city].name} from the USA map.` : `Your own home in ${cities[state.city].name}.`}</p></div>
        <p>${kind === 'business' ? 'Rent arrives automatically on your next city visit. Your first payment comes after you leave and return.' : 'House ownership is saved. Homes are a place to call your own and do not pay rent.'}</p>
        <div class="status">${owned ? 'OWNERSHIP SAVED ✓' : canBuy ? `$${state.cash.toLocaleString()} AVAILABLE · KEEP $${reserve} WORKING CASH` : `$${(asset.price + reserve - state.cash).toLocaleString()} MORE NEEDED · KEEP $${reserve} WORKING CASH`}</div>
        <div class="actions"><button id="buy-property" ${owned || !canBuy ? 'disabled' : ''}>${owned ? 'ALREADY OWNED' : `BUY ${kind.toUpperCase()}`}</button><button class="secondary" id="leave">BACK TO STREET</button></div>`);
    document.querySelector('#leave')!.addEventListener('click', close);
    document.querySelector('#buy-property')!.addEventListener('click', () => {
        if (!purchaseProperty(state, asset.id))
            return;
        save();
        game.scene.start('world');
        toast(`${kind === 'house' ? 'HOME' : 'BUSINESS'} PURCHASED · ${asset.name}`);
        openProperty(kind);
    });
}
const game = new Phaser.Game({ type: Phaser.AUTO, parent: 'game', width: 1100, height: 620, backgroundColor: '#19343e', pixelArt: true, scene: [World], scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, input: { keyboard: true } });
document.querySelector('#menu')!.addEventListener('click', menu);
document.querySelector('.brand')!.addEventListener('click', e => { e.preventDefault(); menu(); });
setInterval(() => {
    if (modal === 'shop')
        renderShop();
}, 1000);
window.addEventListener('pagehide', save);
save();
menu();
