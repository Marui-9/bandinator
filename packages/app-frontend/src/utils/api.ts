import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Documents
export const uploadDocument = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getDocuments = () => api.get('/documents');
export const getDocument = (id: number) => api.get(`/documents/${id}`);
export const deleteDocument = (id: number) => api.delete(`/documents/${id}`);
export const searchDocuments = (query: string) => api.get(`/documents/search?q=${query}`);

// Tenders
export const createTender = (data: any) => api.post('/tenders', data);
export const getTenders = () => api.get('/tenders');
export const getTender = (id: number) => api.get(`/tenders/${id}`);
export const updateTender = (id: number, data: any) => api.put(`/tenders/${id}`, data);
export const deleteTender = (id: number) => api.delete(`/tenders/${id}`);

// Rules
export const createRule = (data: any) => api.post('/rules', data);
export const getRules = () => api.get('/rules');
export const getRule = (id: number) => api.get(`/rules/${id}`);
export const updateRule = (id: number, data: any) => api.put(`/rules/${id}`, data);
export const deleteRule = (id: number) => api.delete(`/rules/${id}`);

// Analysis
export const runAnalysis = (tenderId: number) => api.post(`/analysis/run/${tenderId}`);
export const getAnalysisByTender = (tenderId: number) => api.get(`/analysis/tender/${tenderId}`);
export const getAnalysis = (id: number) => api.get(`/analysis/${id}`);

// Export
export const exportPDF = (analysisId: number) => {
  return api.get(`/export/pdf/${analysisId}`, {
    responseType: 'blob',
  });
};

export const exportCSV = (analysisId: number) => {
  return api.get(`/export/csv/${analysisId}`, {
    responseType: 'blob',
  });
};

// Knowledge Base
export const searchKB = (query: string) => api.get(`/kb/search?q=${encodeURIComponent(query)}`);
export const chatWithKB = (message: string) => api.post('/kb/chat', { message });

export default api;
