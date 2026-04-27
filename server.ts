import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import cors from "cors";
import net from "net";
import { db, initSchema } from "./lib/db";
import "dotenv/config";

const isPostgresSync = process.env.DATABASE_URL ? true : false;

// Simple JSON Database setup
const DB_PATH = path.join(process.cwd(), "db.json");
const initJsonDb = () => {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({
      computers: [
        {
          id: "pc-001",
          name: "WORKSTATION-01",
          model: "Dell OptiPlex 7080",
          serialNumber: "SN-992-KLA-12",
          status: "In Use",
          assignedTo: "Иванов И.И.",
          location: "Офис 402",
          cpu: "Intel i7-10700",
          ram: "16",
          storage: "512GB NVMe",
          createdAt: new Date().toISOString(),
          notes: "Главный бухгалтер"
        },
        {
          id: "pc-002",
          name: "DESIGN-MAC-01",
          model: "Mac mini M2",
          serialNumber: "SN-MAC-221-LP",
          status: "Available",
          assignedTo: "",
          location: "Склад А",
          cpu: "Apple M2",
          ram: "8",
          storage: "256GB SSD",
          createdAt: new Date().toISOString(),
          notes: "В резерве"
        }
      ],
      syncLogs: [],
      users: [
        { id: "1", username: "admin", password: "123", role: "superadmin", name: "Главный Администратор" }
      ],
      settings: {
        companyName: "HelperSystemAdmins (HSA)",
        oneCBaseUrl: "http://1c-server.local/Base1C/hs/InvAPI",
        syncToken: "hsa_admin_2026"
      }
    }, null, 2));
  }
};
initJsonDb();

const getDb = () => JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
const saveDb = (data: any) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

async function startServer() {
  await initSchema();
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // --- Authentication & User Management ---
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const db = getDb();
    const user = db.users?.find((u: any) => u.username === username && u.password === password);
    
    if (user) {
      const { password: _, ...safeUser } = user;
      res.json({ user: safeUser, token: `token_${user.id}_${Date.now()}` });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  });

  app.get("/api/users", (req, res) => {
    const db = getDb();
    res.json(db.users || []);
  });

  app.post("/api/users", (req, res) => {
    const db = getDb();
    const newUser = { id: Math.random().toString(36).substr(2, 9), ...req.body };
    db.users = [...(db.users || []), newUser];
    saveDb(db);
    res.json(newUser);
  });

  app.delete("/api/users/:id", (req, res) => {
    const db = getDb();
    db.users = (db.users || []).filter((u: any) => u.id !== req.params.id);
    saveDb(db);
    res.json({ success: true });
  });

  // API Routes
  app.get("/api/computers", async (req, res) => {
    const data = await db.getComputers();
    res.json(data);
  });

  app.post("/api/computers", async (req, res) => {
    const jsonDb = getDb();
    const newComputer = {
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      ...req.body
    };
    jsonDb.computers.push(newComputer);
    saveDb(jsonDb);
    res.status(201).json(newComputer);
  });

  app.put("/api/computers/:id", async (req, res) => {
    const updated = await db.updateComputer(req.params.id, req.body);
    if (updated) {
        res.json(updated);
    } else {
        res.status(404).send("Not found");
    }
  });

  app.delete("/api/computers/:id", (req, res) => {
    const db = getDb();
    db.computers = db.computers.filter((c: any) => c.id !== req.params.id);
    saveDb(db);
    res.status(204).send();
  });

  // Groups API
  app.get("/api/groups", async (req, res) => {
    const jsonDb = getDb();
    if (isPostgresSync) {
      const g = await db.query("SELECT * FROM groups");
      return res.json(g.rows);
    }
    res.json(jsonDb.groups || []);
  });

  app.post("/api/groups", async (req, res) => {
    const { name, parentId } = req.body;
    const id = "grp-" + Math.random().toString(36).substr(2, 5);
    const jsonDb = getDb();
    const newGroup = { id, name, parentId };
    
    if (isPostgresSync) {
      await db.query("INSERT INTO groups (id, name, parent_id) VALUES ($1, $2, $3)", [id, name, parentId]);
    } else {
      if (!jsonDb.groups) jsonDb.groups = [];
      jsonDb.groups.push(newGroup);
      saveDb(jsonDb);
    }
    res.json(newGroup);
  });

  app.delete("/api/groups/:id", async (req, res) => {
    const { id } = req.params;
    if (isPostgresSync) {
      await db.query("UPDATE computers SET group_id = NULL WHERE group_id = $1", [id]);
      await db.query("DELETE FROM groups WHERE id = $1", [id]);
    } else {
      const jsonDb = getDb();
      jsonDb.groups = (jsonDb.groups || []).filter((g: any) => g.id !== id);
      jsonDb.computers.forEach((c: any) => { if (c.groupId === id) delete c.groupId; });
      saveDb(jsonDb);
    }
    res.status(204).send();
  });

  app.get("/api/computers/:id/vnc-check", async (req, res) => {
    const computers = await db.getComputers();
    const pc = computers.find((c: any) => c.id === req.params.id);
    if (!pc || !pc.lastIp) return res.status(404).json({ active: false });

    // Use the first IP in the list
    const ip = pc.lastIp.split(",")[0].trim();
    
    try {
      const probe = new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(1500);
        socket.on("connect", () => {
          socket.destroy();
          resolve(true);
        });
        socket.on("timeout", () => {
          socket.destroy();
          resolve(false);
        });
        socket.on("error", () => {
          socket.destroy();
          resolve(false);
        });
        socket.connect(5900, ip);
      });

      const isAvailable = await probe;
      res.json({ active: isAvailable, port: 5900 });
    } catch (err) {
      res.json({ active: false, error: String(err) });
    }
  });

  // 1C Integration Endpoints
  // This is what 1C will call to fetch inventory data
  app.get("/api/1c/inventory", (req, res) => {
    const token = req.headers["authorization"];
    const db = getDb();
    
    if (token !== `Bearer ${db.settings.syncToken}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    res.json({
      timestamp: new Date().toISOString(),
      data: db.computers.map((c: any) => ({
        external_id: c.id,
        name: c.name,
        serial: c.serialNumber,
        model: c.model,
        owner: c.assignedTo,
        status: c.status
      }))
    });
  });

  // 1C can push updates back to site
  app.post("/api/1c/sync", (req, res) => {
    const token = req.headers["authorization"];
    const db = getDb();
    
    if (token !== `Bearer ${db.settings.syncToken}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { action, payload } = req.body;
    db.syncLogs.push({
      timestamp: new Date().toISOString(),
      action,
      payload
    });
    saveDb(db);

    res.json({ status: "success", message: "Sync received" });
  });

  app.get("/api/settings", (req, res) => {
    const db = getDb();
    res.json(db.settings);
  });

  // Agent Report Endpoint
  app.post("/api/agent/report", async (req, res) => {
    const jsonDb = getDb();
    const data = req.body;
    
    if (!data.id) {
      console.error("Agent report rejected: Missing ID");
      return res.status(400).send("Missing ID");
    }

    console.log(`>>> Report from agent: ${data.name} (IP: ${data.ip})`);

    // We search by the Unique ID provided by agent (which is Serial+Name)
    let computer = jsonDb.computers.find((c: any) => c.agentId === data.id || c.serialNumber === data.serialNumber);

    if (computer) {
      const historyEntries: any[] = [];
      const fieldsToTrack = ['cpu', 'ram', 'storage', 'model', 'gpu', 'motherboard', 'os', 'ip'];
      
      fieldsToTrack.forEach(field => {
        if (data[field] && String(data[field]) !== String(computer[field])) {
          historyEntries.push({
            date: new Date().toISOString(),
            field: field.charAt(0).toUpperCase() + field.slice(1),
            oldValue: String(computer[field] || "-"),
            newValue: String(data[field]),
            author: "Agent"
          });
        }
      });

      Object.assign(computer, {
        agentId: data.id,
        hostname: data.name,
        serialNumber: data.serialNumber || computer.serialNumber,
        updatedAt: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        cpu: data.cpu || computer.cpu,
        cpuCores: data.cpuCores || computer.cpuCores,
        ram: data.ram || computer.ram,
        storage: data.storage || computer.storage,
        os: data.os || computer.os,
        lastIp: data.ip || computer.lastIp,
        model: data.model || computer.model,
        manufacturer: data.manufacturer || computer.manufacturer,
        gpu: data.gpu || computer.gpu,
        motherboard: data.motherboard || computer.motherboard,
        software: data.software || computer.software || [],
        status: computer.status || "In Use",
        history: [...(computer.history || []), ...historyEntries]
      });
    } else {
      computer = {
        id: "pc-" + Math.random().toString(36).substr(2, 5),
        agentId: data.id,
        name: data.name || "Unknown PC",
        hostname: data.name,
        serialNumber: data.serialNumber || data.id,
        manufacturer: data.manufacturer || "Unknown",
        model: data.model || "Unknown Model",
        status: "In Use",
        assignedTo: "Auto-detected",
        location: "Auto-detected",
        cpu: data.cpu,
        cpuCores: data.cpuCores,
        ram: data.ram,
        storage: data.storage,
        gpu: data.gpu,
        motherboard: data.motherboard,
        lastIp: data.ip,
        os: data.os,
        software: data.software || [],
        createdAt: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        notes: "Automatically registered by HSA Agent",
        history: [
          { date: new Date().toISOString(), field: "Registration", oldValue: "-", newValue: "Agent Auto-reg", author: "Agent" }
        ]
      };
      jsonDb.computers.push(computer);
    }

    saveDb(jsonDb);

    // Sync to PostgreSQL
    try {
      await db.upsertComputer({
        id: computer.id,
        name: computer.name,
        serialNumber: computer.serialNumber,
        manufacturer: computer.manufacturer,
        model: computer.model,
        cpu: computer.cpu,
        cpuCores: computer.cpuCores,
        ram: computer.ram,
        storage: computer.storage,
        gpu: computer.gpu,
        motherboard: computer.motherboard,
        os: computer.os,
        lastIp: computer.lastIp,
        software: computer.software
      });
    } catch (err) {
      console.error("Postgres Sync Error:", err);
    }

    res.json({ 
      success: true, 
      timestamp: new Date().toISOString(),
      vncPassword: jsonDb.settings.vncPassword || "",
      interval: jsonDb.settings.agentInterval || 15
    });
  });

  app.post("/api/settings", (req, res) => {
    const db = getDb();
    db.settings = { ...db.settings, ...req.body };
    saveDb(db);
    res.json(db.settings);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
