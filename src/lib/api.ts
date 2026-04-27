import { Computer, Settings } from "../types";

const API_BASE = "/api";

export const api = {
  getComputers: async (): Promise<Computer[]> => {
    const res = await fetch(`${API_BASE}/computers`);
    return res.json();
  },
  createComputer: async (computer: Partial<Computer>): Promise<Computer> => {
    const res = await fetch(`${API_BASE}/computers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(computer),
    });
    return res.json();
  },
  updateComputer: async (id: string, computer: Partial<Computer>): Promise<Computer> => {
    const res = await fetch(`${API_BASE}/computers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(computer),
    });
    return res.json();
  },
  deleteComputer: async (id: string): Promise<void> => {
    await fetch(`${API_BASE}/computers/${id}`, { method: "DELETE" });
  },
  getSettings: async (): Promise<Settings> => {
    const res = await fetch(`${API_BASE}/settings`);
    return res.json();
  },
  saveSettings: async (settings: Settings): Promise<Settings> => {
    const res = await fetch(`${API_BASE}/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    return res.json();
  },
  
  // --- Auth & Users ---
  login: async (credentials: any) => {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) throw new Error("Invalid login");
    return res.json();
  },

  getUsers: async (): Promise<any[]> => {
    const res = await fetch(`${API_BASE}/users`);
    return res.json();
  },

  createUser: async (user: any): Promise<any> => {
    const res = await fetch(`${API_BASE}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });
    return res.json();
  },

  deleteUser: async (id: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: "DELETE",
    });
    return res.json();
  },

  getGroups: async (): Promise<any[]> => {
    const res = await fetch(`${API_BASE}/groups`);
    return res.json();
  },

  addGroup: async (data: any): Promise<any> => {
    const res = await fetch(`${API_BASE}/groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  deleteGroup: async (id: string): Promise<void> => {
    await fetch(`${API_BASE}/groups/${id}`, { method: "DELETE" });
  }
};
