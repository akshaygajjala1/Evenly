// Minimal mock client; replace with real fetch/axios calls when backend is ready.
export const apiClient = {
  get: async () => {
    throw new Error("API client not wired yet.");
  },
  post: async () => {
    throw new Error("API client not wired yet.");
  }
};
