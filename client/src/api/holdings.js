import apiClient from './client';

export async function getHoldings() {
  const { data } = await apiClient.get('/holdings');
  return data.holdings;
}

export async function createHolding(payload) {
  const { data } = await apiClient.post('/holdings', payload);
  return data.holding;
}

export async function updateHolding(id, payload) {
  const { data } = await apiClient.put(`/holdings/${id}`, payload);
  return data.holding;
}

export async function deleteHolding(id) {
  const { data } = await apiClient.delete(`/holdings/${id}`);
  return data;
}
