import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fresh,trade,cargo,purchase,valid,price,restore,workingCash,purchaseProperty,visitCity} from './economy.ts';
import {vehicles,cities,properties} from './data.ts';
test('new run, cargo limits, and profitable market cycle',()=>{
 const s=fresh(),low=s.marketEpoch,high=low+10000;
 assert.deepEqual(s.unlocked,[0]);assert.equal(s.vehicle,0);
 assert.equal(trade(s,'Marijuana',true,17,low),false);
 assert.equal(trade(s,'Heroin',false,1,low),false);
 assert.equal(trade(s,'Marijuana',true,5,low),true);
 assert.equal(cargo(s),5);const cash=s.cash;
 assert.equal(trade(s,'Marijuana',false,5,high),true);
 assert.equal(s.cash,cash+5*price(s,'Marijuana',high));assert.equal(cargo(s),0);
 assert.equal(trade(s,'Marijuana',true,-1,low),false);
});
test('all eight upgrades, save roundtrip, and no repeat purchases',()=>{
 const s=fresh();s.cash=50000;
 for(let city=0;city<cities.length;city++){
 s.city=city;const before=s.cash;
 assert.equal(purchase(s),true);assert.equal(s.cash,before-vehicles[city+1].price);
 assert.equal(s.vehicle,city+1);assert.equal(purchase(s),false);
 if(city<cities.length-1)assert.ok(s.unlocked.includes(city+1));
 assert.equal(valid(JSON.parse(JSON.stringify(s))),true);
 }
 assert.deepEqual(s.completed,[0,1,2,3,4,5,6,7]);assert.equal(s.assets.length,9);
});
test('two minute economy has no locked-city dead end',()=>{
 const s=fresh();let elapsed=0;
 // Fixed markets make duration checks reproducible; live markets remain randomized.
 s.markets=cities.map((_,city)=>[50,110,180].map(price=>Math.round(price*(1+city*.35))));
 for(let city=0;city<3;city++){
 s.city=city;
 while(s.cash<vehicles[city+1].price+workingCash(s)){
 const drug=s.cash>=price(s,'Heroin',s.marketEpoch)?'Heroin':'Marijuana';
 const q=Math.min(vehicles[s.vehicle].cargoCapacity,Math.floor(s.cash/price(s,drug,s.marketEpoch)));
 assert.ok(q>0);assert.ok(trade(s,drug,true,q,s.marketEpoch));
 assert.ok(trade(s,drug,false,q,s.marketEpoch+10000));elapsed+=20;
 }
 assert.ok(purchase(s));elapsed+=12;
 }
 assert.ok(elapsed<=120,`estimated ${elapsed}s`);
});
test('invalid saves are rejected',()=>{
 assert.equal(valid(null),false);const s=fresh();s.cash=-1;assert.equal(valid(s),false);
 s.cash=100;s.vehicle=50;assert.equal(valid(s),false);
});

test('completed original save keeps progress and opens Salt Lake City',()=>{
 const old=fresh();old.cash=900;old.city=2;old.vehicle=3;
 old.completed=[0,1,2];old.unlocked=[0,1,2];old.assets=['starter','subaru','tesla','bmw'];
 old.inventory.Heroin=4;old.markets=old.markets.slice(0,3);old.screen='city';old.x=840;
 const migrated=restore(old);
 assert.ok(migrated);assert.equal(migrated.cash,900);assert.equal(migrated.vehicle,3);
 assert.equal(migrated.inventory.Heroin,4);assert.equal(migrated.x,840);
 assert.deepEqual(migrated.markets.slice(0,3),old.markets);assert.equal(migrated.markets.length,8);
 assert.deepEqual(migrated.unlocked,[0,1,2,3]);assert.equal(old.markets.length,3);
 assert.deepEqual(restore(migrated),migrated);
});
test('unfinished original save preserves its locks',()=>{
 const old=fresh();old.markets=old.markets.slice(0,3);
 const migrated=restore(old);assert.ok(migrated);assert.deepEqual(migrated.unlocked,[0]);
 assert.equal(restore({...old,markets:[[1,2],null,[]]}),null);
});
test('working cash funds the next city even at the minimum purchase balance',()=>{
 const s=fresh();s.city=3;s.vehicle=3;s.unlocked=[0,1,2,3];s.completed=[0,1,2];
 s.markets[4]=[135,300,500];s.cash=vehicles[4].price+134;
 assert.equal(purchase(s),false);s.cash++;
 assert.equal(purchase(s),true);assert.equal(s.cash,135);s.city=4;
 assert.equal(trade(s,'Marijuana',true,1,s.marketEpoch),true);
});
test('eight-city route remains economically reachable',()=>{
 const s=fresh();let elapsed=0;
 // Fixed markets make duration checks reproducible; live markets remain randomized.
 s.markets=cities.map((_,city)=>[50,110,180].map(price=>Math.round(price*(1+city*.35))));
 for(let city=0;city<cities.length;city++){
 s.city=city;
 while(s.cash<vehicles[city+1].price+workingCash(s)){
 const drug=s.cash>=price(s,'Heroin',s.marketEpoch)?'Heroin':'Marijuana';
 const q=Math.min(vehicles[s.vehicle].cargoCapacity,Math.floor(s.cash/price(s,drug,s.marketEpoch)));
 assert.ok(q>0);assert.ok(trade(s,drug,true,q,s.marketEpoch));
 assert.ok(trade(s,drug,false,q,s.marketEpoch+10000));elapsed+=20;
 }
 assert.ok(purchase(s));elapsed+=12;
 }
 assert.ok(elapsed<=480,`estimated ${elapsed}s`);
});

test('each city has a purchasable house and rent-paying business',()=>{
 for(let city=0;city<cities.length;city++){
 const assets=properties.filter(p=>p.city===city);
 assert.equal(assets.length,2);assert.equal(assets.filter(p=>p.kind==='house').length,1);
 assert.equal(assets.filter(p=>p.kind==='business'&&p.rent>0).length,1);
 const s=fresh();s.city=city;s.screen='city';s.unlocked=[city];s.cash=50000;
 const before=s.cash;
 for(const a of assets){assert.equal(purchaseProperty(s,a.id),true);assert.equal(purchaseProperty(s,a.id),false);}
 assert.equal(s.cash,before-assets.reduce((n,a)=>n+a.price,0));
 assert.equal(s.vehicle,0);assert.deepEqual(s.completed,[]);assert.deepEqual(s.unlocked,[city]);
 const saved=restore(JSON.parse(JSON.stringify(s)));assert.ok(saved);assert.deepEqual(saved.assets,s.assets);
 }
});
test('property purchases reject wrong city, insufficient cash, and invalid IDs',()=>{
 const s=fresh();s.screen='city';s.cash=50000;
 assert.equal(purchaseProperty(s,'house-1'),false);assert.equal(purchaseProperty(s,'missing'),false);
 s.cash=properties.find(p=>p.id==='house-0').price+workingCash(s)-1;
 const cash=s.cash;assert.equal(purchaseProperty(s,'house-0'),false);assert.equal(s.cash,cash);
 s.cash=50000;s.screen='map';assert.equal(purchaseProperty(s,'house-0'),false);
});
test('rent pays once per map entry, stays local, and does not pay on reload',()=>{
 const s=fresh();s.screen='city';s.cash=10000;
 assert.ok(purchaseProperty(s,'business-0'));assert.ok(purchaseProperty(s,'house-0'));
 const business=properties.find(p=>p.id==='business-0');const cash=s.cash;
 assert.equal(visitCity(s,0),null);assert.equal(s.cash,cash);
 s.screen='map';assert.equal(visitCity(s,0),business.rent);assert.equal(s.cash,cash+business.rent);
 assert.equal(visitCity(s,0),null);assert.equal(s.cash,cash+business.rent);
 const restored=restore(JSON.parse(JSON.stringify(s)));assert.ok(restored);
 assert.equal(restored.cash,s.cash);assert.equal(visitCity(restored,0),null);
 restored.screen='map';restored.unlocked.push(1);assert.equal(visitCity(restored,1),0);
 assert.equal(restored.cash,s.cash);restored.screen='map';
 assert.equal(visitCity(restored,0),business.rent);assert.equal(restored.cash,cash+business.rent*2);
});
test('unowned businesses and houses pay no rent; locked cities cannot be visited',()=>{
 const s=fresh();const cash=s.cash;
 assert.equal(visitCity(s,1),null);assert.equal(s.screen,'map');assert.equal(s.cash,cash);
 assert.equal(visitCity(s,0),0);assert.ok(purchaseProperty(s,'house-0'));
 const after=s.cash;s.screen='map';assert.equal(visitCity(s,0),0);assert.equal(s.cash,after);
});

test('completed six-city save unlocks Austin and preserves existing progress',()=>{
 const old=fresh();old.city=5;old.vehicle=6;old.cash=800;
 old.completed=[0,1,2,3,4,5];old.unlocked=[0,1,2,3,4,5];
 old.assets=['starter',...vehicles.slice(1,7).map(v=>v.id),'house-5','business-5'];
 old.markets=old.markets.slice(0,6);old.inventory.Heroin=3;
 const saved=structuredClone(old),s=restore(old);
 assert.ok(s);assert.deepEqual(old,saved);assert.equal(s.markets.length,8);
 assert.deepEqual(s.markets.slice(0,6),old.markets);assert.deepEqual(s.assets,old.assets);
 assert.equal(s.cash,800);assert.equal(s.inventory.Heroin,3);
 assert.deepEqual(s.unlocked,[0,1,2,3,4,5,6]);
 s.screen='map';assert.equal(visitCity(s,7),null);assert.equal(visitCity(s,6),0);
 s.cash=vehicles[7].price+workingCash(s);assert.ok(purchase(s));
 s.screen='map';assert.equal(visitCity(s,7),0);
 s.cash=vehicles[8].price+workingCash(s);assert.ok(purchase(s));
 assert.equal(s.completed.length,8);assert.deepEqual(restore(s),s);
});
test('unfinished six-city saves retain their locks and malformed market counts are rejected',()=>{
 const old=fresh();old.markets=old.markets.slice(0,6);
 const s=restore(old);assert.ok(s);assert.deepEqual(s.unlocked,[0]);
 assert.equal(restore({...old,markets:old.markets.slice(0,5)}),null);
});
