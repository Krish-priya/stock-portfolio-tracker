import apiClient from './client';

export async function getPortfolioSummary() {
  const { data } = await apiClient.get('/portfolio/summary');
  return data;
}

export async function getPortfolioHistory() {
  const { data } = await apiClient.get('/portfolio/history');
  return data.history;
}
