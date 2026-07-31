import apiClient from './client';

export async function getWatchlist() {
  const { data } = await apiClient.get('/watchlist');
  return data.watchlist;
}

export async function addWatchlistSymbol(symbol) {
  const { data } = await apiClient.post('/watchlist', { symbol });
  return data.item;
}

export async function removeWatchlistItem(id) {
  const { data } = await apiClient.delete(`/watchlist/${id}`);
  return data;
}
