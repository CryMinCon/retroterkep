import test from 'node:test';
import assert from 'node:assert/strict';
import {calculatePrice} from '../dist/assets/pricing.js';

test('approved quote example: 500 units, 1450 HUF net per unit, 27% VAT', () => {
  assert.deepEqual(calculatePrice(500), {quantity:500,tier:0,unit:1450,net:725000,gross:920750});
});
test('each approved tier includes both endpoints', () => {
  const expected = [[1000,1450,1450000,1841500],[1001,1250,1251250,1589088],[2000,1250,2500000,3175000],[2001,1000,2001000,2541270],[3000,1000,3000000,3810000],[3001,800,2400800,3049016],[4000,800,3200000,4064000]];
  for (const [quantity,unit,net,gross] of expected) {
    const price=calculatePrice(quantity);
    assert.equal(price.unit,unit,`unit price at ${quantity}`);
    assert.equal(price.net,net,`net total at ${quantity}`);
    assert.equal(price.gross,gross,`gross total at ${quantity}`);
  }
});
test('unquoted quantities and invalid input cannot produce an offer price', () => {
  for(const value of [0,499,4001,500.5,NaN,Infinity,'500',undefined]) assert.throws(()=>calculatePrice(value),RangeError);
});
