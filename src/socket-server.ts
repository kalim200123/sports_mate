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
        // 1. Check existing record and room type
        const checkSql = `
            SELECT r.title, ur.status 
            FROM rooms r 
            LEFT JOIN user_rooms ur ON ur.room_id = r.id AND ur.user_id = ? 
            WHERE r.id = ?
        `;
        const [rows] = await pool.query<RowDataPacket[]>(checkSql, [userId, Number(roomId)]);

        if (rows.length > 0) {
          const roomTitle = rows[0].title;
          const userStatus = rows[0].status;
          const isOfficial = roomTitle === "OFFICIAL_CHAT";

          if (userStatus === "KICKED") {
            socket.emit("join_error", { message: "강퇴된 방에는 재입장할 수 없습니다." });
            return;
          }

          // 2. If no record, insert
          if (!userStatus) {
            const initialStatus = isOfficial ? "JOINED" : "PENDING";
            // ... (Use implicit logic or just separate blocks)

            if (isOfficial) {
              await pool.query(
                `INSERT INTO user_rooms (user_id, room_id, status, role, requested_at, joined_at, decided_at) VALUES (?, ?, 'JOINED', 'GUEST', NOW(), NOW(), NOW())`,
                [userId, Number(roomId)]
              );
            } else {
              await pool.query(
                `INSERT INTO user_rooms (user_id, room_id, status, role, requested_at) VALUES (?, ?, 'PENDING', 'GUEST', NOW())`,
                [userId, Number(roomId)]
              );
            }

            // 3. Notify
            const [userRows] = await pool.query<RowDataPacket[]>(
              "SELECT nickname, avatar_id, profile_image_url FROM users WHERE id = ?",
              [userId]
            );
            const user = userRows[0];
            const notificationData = {
              userId,
              nickname: user.nickname,
              avatar_url: user.profile_image_url || getAvatarUrl(user.avatar_id),
              status: isOfficial ? "JOINED" : "PENDING",
            };

            if (isOfficial) {
              socket.emit("join_approved", notificationData);
            } else {
              io.to(roomId).emit("join_request", notificationData);
            }
          } else if (userStatus === "LEFT") {
            // 2.5 Re-joining logic: Update existing record
            if (isOfficial) {
              await pool.query(
                `UPDATE user_rooms SET status = 'JOINED', joined_at = NOW(), decided_at = NOW() WHERE user_id = ? AND room_id = ?`,
                [userId, Number(roomId)]
              );
            } else {
              await pool.query(
                `UPDATE user_rooms SET status = 'PENDING', requested_at = NOW() WHERE user_id = ? AND room_id = ?`,
                [userId, Number(roomId)]
              );
            }

            // 3. Notify (Exact same as new join)
            const [userRows] = await pool.query<RowDataPacket[]>(
              "SELECT nickname, avatar_id, profile_image_url FROM users WHERE id = ?",
              [userId]
            );
            const user = userRows[0];
            const notificationData = {
              userId,
              nickname: user.nickname,
              avatar_url: user.profile_image_url || getAvatarUrl(user.avatar_id),
              status: isOfficial ? "JOINED" : "PENDING",
            };

            if (isOfficial) {
              socket.emit("join_approved", notificationData);
            } else {
              io.to(roomId).emit("join_request", notificationData);
            }
          }
        }
      } catch (err) {
        console.error("Error recording join participation:", err);
      }
    }
  });

  // Host approves a user
  socket.on("approve_join", async (data: { roomId: string; userId: number }) => {
    // ... existing approve logic ... (keep unchanged, just showing context)
    const { roomId, userId } = data;
    try {
      await pool.query("UPDATE user_rooms SET status = 'JOINED' WHERE user_id = ? AND room_id = ?", [
        userId,
        Number(roomId),
      ]);
      const [countRows] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) as current_count FROM user_rooms WHERE room_id = ? AND status = 'JOINED'`,
        [Number(roomId)]
      );
      const currentCount = countRows[0].current_count;
      io.to(roomId).emit("room_update", { current_count: currentCount });

      // ... capacity code ...

      const [userRows] = await pool.query<RowDataPacket[]>(
        "SELECT nickname, avatar_id, profile_image_url FROM users WHERE id = ?",
        [userId]
      );
      const acceptedUser = userRows[0];
      io.to(roomId).emit("join_approved", {
        userId,
        nickname: acceptedUser.nickname,
        avatar_url: acceptedUser.profile_image_url || getAvatarUrl(acceptedUser.avatar_id),
      });
    } catch (err) {
      console.error("Error approving join:", err);
    }
  });

  // Host kicks a user
  socket.on("kick_user", async (data: { roomId: string; userId: number; nickname?: string }) => {
    const { roomId, userId, nickname } = data;
    console.log(`Kick user ${userId} from room ${roomId}`);

    // 1. Broadcast update count
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as current_count FROM user_rooms WHERE room_id = ? AND status = 'JOINED'`,
      [Number(roomId)]
    );
    const currentCount = countRows[0].current_count;
    io.to(roomId).emit("room_update", { current_count: currentCount });

    // 2. Notify User & Room
    io.to(roomId).emit("user_kicked", { userId, nickname });

    // 3. System Message
    try {
      const msgContent = `${nickname || "사용자"}님이 강퇴되었습니다.`;
      const [res] = await pool.query<ResultSetHeader>(
        `INSERT INTO room_messages (room_id, user_id, type, content) VALUES (?, ?, 'SYSTEM', ?)`,
        [Number(roomId), userId, msgContent]
      );
      // Broadcast System Message
      io.to(roomId).emit("receive_message", {
        id: res.insertId,
        room_id: Number(roomId),
        user_id: userId,
        content: msgContent,
        created_at: new Date().toISOString(),
        nickname: "SYSTEM",
        type: "SYSTEM",
      });
    } catch (e) {
      console.error("Sys msg error", e);
    }
  });

  // User leaves a room
  socket.on("leave_room", async (data: { roomId: string; userId: number; nickname?: string }) => {
    const { roomId, userId, nickname } = data;
    console.log(`User ${userId} leaving room ${roomId}`);

    // 1. Broadcast update count (Leave API already called)
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as current_count FROM user_rooms WHERE room_id = ? AND status = 'JOINED'`,
      [Number(roomId)]
    );
    const currentCount = countRows[0].current_count;
    io.to(roomId).emit("room_update", { current_count: currentCount });

    // 2. System Message
    try {
      const msgContent = `${nickname || "사용자"}님이 나갔습니다.`;
      const [res] = await pool.query<ResultSetHeader>(
        `INSERT INTO room_messages (room_id, user_id, type, content) VALUES (?, ?, 'SYSTEM', ?)`,
        [Number(roomId), userId, msgContent]
      );
      io.to(roomId).emit("receive_message", {
        id: res.insertId,
        room_id: Number(roomId),
        user_id: userId,
        content: msgContent,
        created_at: new Date().toISOString(),
        nickname: "SYSTEM",
        type: "SYSTEM",
      });
    } catch (e) {
      console.error("Sys msg error", e);
    }

    socket.leave(roomId);
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
      const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT nickname, avatar_id, profile_image_url FROM users WHERE id = ?",
        [user_id]
      );
      const user = rows[0];

      // 3. Broadcast to Room
      const messageToEmit = {
        id: (result as ResultSetHeader).insertId, // Type assertion
        room_id,
        user_id,
        content,
        created_at: new Date().toISOString(),
        nickname: user?.nickname || "Unknown",
        avatar_url: user?.profile_image_url || getAvatarUrl(user?.avatar_id),
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
