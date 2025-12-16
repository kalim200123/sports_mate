import dotenv from "dotenv";
import { createServer } from "http";
import mysql, { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { Server } from "socket.io";

// Load environment variables
dotenv.config();

/**
 * MySQL Connection Pool (Inlined for independent socket server execution)
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const PORT = 4000;
const httpServer = createServer();

function getAvatarUrl(avatarId: number): string {
  // Default to 1 if invalid or null
  const validId = avatarId && avatarId > 0 && avatarId <= 10 ? avatarId : 1;
  return `/avatars/${validId}.png`;
}

const io = new Server(httpServer, {
  cors: {
    origin: "*", // Adjust for production
    methods: ["GET", "POST"],
    credentials: true,
  },
});

interface ChatMessage {
  room_id: number;
  user_id: number;
  content: string;
  sender_nickname?: string; // Optional for client display optimization
}

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Join a specific room
  socket.on("join_room", async (data: { roomId: string; userId?: number }) => {
    const { roomId, userId } = data;
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);

    if (userId) {
      try {
        // 1. Check existing record
        const checkSql = `SELECT status, role FROM user_rooms WHERE user_id = ? AND room_id = ?`;
        const [checkRows] = await pool.query<RowDataPacket[]>(checkSql, [userId, Number(roomId)]);

        // 2. If no record, insert as PENDING
        if (checkRows.length === 0) {
          await pool.query(
            `INSERT INTO user_rooms (user_id, room_id, status, role, requested_at) VALUES (?, ?, 'PENDING', 'GUEST', NOW())`,
            [userId, Number(roomId)]
          );

          // 3. Notify Host
          const [userRows] = await pool.query<RowDataPacket[]>("SELECT nickname, avatar_id FROM users WHERE id = ?", [
            userId,
          ]);
          const user = userRows[0];

          io.to(roomId).emit("join_request", {
            userId,
            nickname: user.nickname,
            avatar_url: getAvatarUrl(user.avatar_id),
            status: "PENDING",
          });
        }
      } catch (err) {
        console.error("Error recording join participation:", err);
      }
    }
  });

  // Host approves a user
  socket.on("approve_join", async (data: { roomId: string; userId: number }) => {
    const { roomId, userId } = data;
    try {
      // 1. Update status to JOINED
      await pool.query("UPDATE user_rooms SET status = 'JOINED' WHERE user_id = ? AND room_id = ?", [
        userId,
        Number(roomId),
      ]);

      // 2. Get updated count
      const [countRows] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) as current_count FROM user_rooms WHERE room_id = ? AND status = 'JOINED'`,
        [Number(roomId)]
      );
      const currentCount = countRows[0].current_count;

      // 3. Broadcast updates
      io.to(roomId).emit("room_update", { current_count: currentCount });

      // Notify the specific user or room that approval happened (optional, for UI refresh)
      const [userRows] = await pool.query<RowDataPacket[]>("SELECT nickname, avatar_id FROM users WHERE id = ?", [
        userId,
      ]);
      const acceptedUser = userRows[0];

      io.to(roomId).emit("join_approved", {
        userId,
        nickname: acceptedUser.nickname,
        avatar_url: getAvatarUrl(acceptedUser.avatar_id),
      });
    } catch (err) {
      console.error("Error approving join:", err);
    }
  });

  // Handle sending messages
  socket.on("send_message", async (data: ChatMessage) => {
    const { room_id, user_id, content } = data;
    console.log(`Message in room ${room_id} from ${user_id}: ${content}`);

    try {
      // 1. Save to Database
      const sql = `
        INSERT INTO room_messages (room_id, user_id, content) 
        VALUES (?, ?, ?)
      `;
      const [result] = await pool.query(sql, [room_id, user_id, content]);

      // 2. Fetch User Nickname (if not provided, or to be secure)
      // Ideally nickname should be joined or passed. For now assuming we broadcast what we get + ID
      // or fetching it again. Let's do a quick fetch to be safe/consistent.
      const [rows] = await pool.query<RowDataPacket[]>("SELECT nickname, avatar_id FROM users WHERE id = ?", [user_id]);
      const user = rows[0];

      // 3. Broadcast to Room
      const messageToEmit = {
        id: (result as ResultSetHeader).insertId, // Type assertion
        room_id,
        user_id,
        content,
        created_at: new Date().toISOString(),
        nickname: user?.nickname || "Unknown",
        avatar_url: getAvatarUrl(user?.avatar_id),
      };

      io.to(String(room_id)).emit("receive_message", messageToEmit);
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Socket.io Server running on port ${PORT}`);
});
