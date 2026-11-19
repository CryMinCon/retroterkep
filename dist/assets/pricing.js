export const MIN_QUANTITY = 500;
export const MAX_QUANTITY = 4000;

export function calculatePrice(quantity) {
  if (!Number.isInteger(quantity) || quantity < MIN_QUANTITY || quantity > MAX_QUANTITY) {
    throw new RangeError('A darabszám 500 és 4000 közötti egész szám legyen.');
  }
  const tier = quantity <= 1000 ? 0 : quantity <= 2000 ? 1 : quantity <= 3000 ? 2 : 3;
  const unit = [1450, 1250, 1000, 800][tier];
  const net = quantity * unit;
  return {quantity, tier, unit, net, gross: Math.round(net * 1.27)};
}
