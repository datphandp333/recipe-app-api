export const SCAN_UNITS = ['items', 'g', 'kg', 'ml', 'l', 'cups', 'tbsp', 'tsp'];
export function scanRequestError(error, { timedOut = false, aborted = false } = {}) {
  if (timedOut) return new Error('The request timed out. Check your connection and try again.');
  if (aborted) return new Error('Request canceled. You can try again.');
  if (/fetch failed|failed to fetch|network request failed|FetchRequestCanceledException/i.test(error?.message || '')) {
    return new Error('Could not reach the server. Check that your phone and computer are on the same Wi-Fi and the backend is running.');
  }
  return error;
}
export function reviewItems(ingredients) {
  return ingredients.slice(0, 30).map((item, index) => ({
    id: String(index), name: item.name, uncertain: item.uncertain !== false,
    selected: true, quantity: '', unit: 'items', status: 'pending',
  }));
}
export function confirmedItems(items) {
  const selected = items.filter(item => item.selected && item.status === 'pending');
  if (!selected.length) throw new Error('Select at least one ingredient.');
  for (const item of selected) {
    const quantity = Number(item.quantity);
    if (!item.name.trim() || item.name.trim().length > 100) throw new Error('Give each selected ingredient a name.');
    if (!item.quantity.trim() || !Number.isFinite(quantity) || quantity < 0.001 || quantity > 999999999.999 || Math.abs(quantity * 1000 - Math.round(quantity * 1000)) > 0.0001) {
      throw new Error(`Enter a positive quantity (up to three decimal places) for ${item.name}.`);
    }
    if (!SCAN_UNITS.includes(item.unit)) throw new Error('Choose a supported unit.');
  }
  return selected.map(item => ({ id: item.id, name: item.name.trim(), quantity: String(Number(item.quantity)), unit: item.unit, expiresOn: null }));
}
export function scanChefPrompt(items) {
  const selected = items.filter(item => item.selected && item.name.trim());
  if (!selected.length) throw new Error('Select at least one ingredient.');
  return `I reviewed these ingredients from a photo: ${selected.map(item => `${item.name.trim()}${item.quantity.trim() ? ` (${item.quantity} ${item.unit})` : ''}`).join(', ')}. Help me choose what to cook. Ask about my preferences and any other ingredients before creating a dish.`.slice(0, 2000);
}
