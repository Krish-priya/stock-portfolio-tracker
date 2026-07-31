import apiClient from './client';

export async function getPortfolioSummary() {
  const { data } = await apiClient.get('/portfolio/summary');
  return data;
}
