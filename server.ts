import { createServer } from "http";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import mongoose from "mongoose";
import { setIO } from "./lib/socket-server";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "4000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

interface ChatPayload {
  conversationId: string;
  message: string;
  sender: "customer" | "admin";
  senderId: string;
  senderName: string;
}

async function connectMongo() {
  const uri = process.env.MONGO_URI?.trim();
  if (!uri) {
    console.error("MONGO_URI not defined");
    return;
  }
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
    console.log("Socket server: MongoDB connected");
  }
}

app.prepare().then(async () => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new SocketIOServer(httpServer, {
    path: "/api/socketio",
    addTrailingSlash: false,
    cors: { origin: "*", methods: ["GET", "POST"] },
  });
  setIO(io);

  await connectMongo();

  const ChatConversation =
    mongoose.models.ChatConversation ||
    mongoose.model(
      "ChatConversation",
      new mongoose.Schema(
        {
          customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
          },
          guestId: { type: mongoose.Schema.Types.ObjectId, default: null },
          customerName: String,
          customerPhone: String,
          customerEmail: String,
          assignedAdmin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
          },
          status: {
            type: String,
            enum: ["active", "pending", "closed"],
            default: "pending",
          },
          messages: [
            {
              sender: { type: String, enum: ["customer", "admin"] },
              senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
              senderName: String,
              message: String,
              timestamp: { type: Date, default: Date.now },
              read: { type: Boolean, default: false },
            },
          ],
          lastMessage: String,
          lastMessageAt: Date,
          unreadCount: { type: Number, default: 0 },
        },
        { timestamps: true },
      ),
    );

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on(
      "join-conversation",
      (payload: string | { conversationId?: string }) => {
        const id =
          typeof payload === "string" ? payload : payload?.conversationId;
        if (id) socket.join(`chat-${id}`);
      },
    );

    socket.on("join-admin", () => {
      socket.join("admin-chat");
    });

    socket.on("join-admin-notifications", () => {
      socket.join("admin-notifications");
    });

    socket.on(
      "send-message",
      async (
        data: ChatPayload & { conversationId: string; message: string },
      ) => {
        try {
          const { conversationId, message } = data;
          let sender = data.sender;
          let senderId = data.senderId;
          let senderName = data.senderName;

          if (sender === "customer" && (!senderId || !senderName)) {
            const conv = await ChatConversation.findById(conversationId).lean();
            if (conv) {
              sender = "customer";
              senderId = (conv.customer || conv.guestId)?.toString() ?? "";
              senderName = conv.customerName ?? "Customer";
            }
          }

          const newMessage = {
            sender: sender ?? "customer",
            senderId: senderId
              ? new mongoose.Types.ObjectId(senderId)
              : undefined,
            senderName: senderName ?? "Customer",
            message,
            timestamp: new Date(),
            read: false,
          };

          const conversation = await ChatConversation.findByIdAndUpdate(
            conversationId,
            {
              $push: { messages: newMessage },
              lastMessage: message,
              lastMessageAt: new Date(),
              status:
                (sender ?? "customer") === "customer" ? "pending" : "active",
              ...((sender ?? "customer") === "customer"
                ? { $inc: { unreadCount: 1 } }
                : { unreadCount: 0 }),
            },
            { returnDocument: "after" },
          );

          if (conversation) {
            const msgWithId =
              conversation.messages[conversation.messages.length - 1];

            io.to(`chat-${conversationId}`).emit("new-message", {
              conversationId,
              message: msgWithId,
            });

            io.to("admin-chat").emit("conversation-updated", {
              conversationId,
              lastMessage: message,
              lastMessageAt: new Date(),
              status: conversation.status,
              unreadCount: conversation.unreadCount,
              senderName,
            });
            if ((sender ?? "customer") === "customer" && (conversation.unreadCount ?? 0) > 0) {
              io.to("admin-notifications").emit("notification", { type: "chat", unreadCount: conversation.unreadCount });
            }
          }
        } catch (err) {
          console.error("send-message error:", err);
          socket.emit("error", { message: "Failed to send message" });
        }
      },
    );

    socket.on(
      "start-conversation",
      async (data: {
        customerId?: string;
        customerName: string;
        customerPhone?: string;
        customerEmail?: string;
        message: string;
      }) => {
        try {
          const isGuest = !data.customerId;
          const guestId = isGuest ? new mongoose.Types.ObjectId() : undefined;

          let conversation;
          if (data.customerId) {
            conversation = await ChatConversation.findOne({
              customer: new mongoose.Types.ObjectId(data.customerId),
              status: { $ne: "closed" },
            });
          } else {
            conversation = data.customerPhone
              ? await ChatConversation.findOne({
                  customerPhone: data.customerPhone.trim(),
                  customer: null,
                  status: { $ne: "closed" },
                })
              : null;
          }

          if (!conversation) {
            conversation = await ChatConversation.create({
              customer: data.customerId
                ? new mongoose.Types.ObjectId(data.customerId)
                : null,
              guestId: guestId ?? null,
              customerName: data.customerName.trim(),
              customerPhone: data.customerPhone?.trim() ?? undefined,
              customerEmail: data.customerEmail?.trim() ?? undefined,
              status: "pending",
              messages: [
                {
                  sender: "customer",
                  senderId: data.customerId
                    ? new mongoose.Types.ObjectId(data.customerId)
                    : guestId,
                  senderName: data.customerName.trim(),
                  message: data.message.trim(),
                  timestamp: new Date(),
                  read: false,
                },
              ],
              lastMessage: data.message.trim(),
              lastMessageAt: new Date(),
              unreadCount: 1,
            });
          } else {
            conversation.messages.push({
              sender: "customer",
              senderId: data.customerId
                ? new mongoose.Types.ObjectId(data.customerId)
                : (conversation.guestId ?? guestId),
              senderName: data.customerName.trim(),
              message: data.message.trim(),
              timestamp: new Date(),
              read: false,
            });
            conversation.lastMessage = data.message.trim();
            conversation.lastMessageAt = new Date();
            conversation.status = "pending";
            conversation.unreadCount += 1;
            await conversation.save();
          }

          const convId = conversation._id.toString();
          socket.join(`chat-${convId}`);
          const firstMsg =
            conversation.messages[conversation.messages.length - 1];
          const msgPayload = firstMsg
            ? {
                _id:
                  (firstMsg as { _id?: unknown })._id?.toString?.() ?? convId,
                sender: firstMsg.sender,
                senderId: firstMsg.senderId?.toString?.(),
                senderName: firstMsg.senderName,
                message: firstMsg.message,
                timestamp: firstMsg.timestamp,
                read: firstMsg.read,
              }
            : null;

          socket.emit("conversation-started", {
            conversationId: convId,
            messages: conversation.messages,
            message: msgPayload,
          });

          io.to("admin-chat").emit("new-conversation", {
            _id: convId,
            customerName: data.customerName.trim(),
            customerPhone: data.customerPhone?.trim(),
            customerEmail: data.customerEmail?.trim(),
            status: conversation.status,
            lastMessage: data.message.trim(),
            lastMessageAt: new Date(),
            unreadCount: conversation.unreadCount,
          });
          io.to("admin-notifications").emit("notification", { type: "chat", unreadCount: conversation.unreadCount });
        } catch (err) {
          console.error("start-conversation error:", err);
          socket.emit("error", { message: "Failed to start conversation" });
        }
      },
    );

    socket.on(
      "mark-read",
      async (payload: string | { conversationId?: string }) => {
        const conversationId =
          typeof payload === "string" ? payload : payload?.conversationId;
        if (!conversationId) return;
        try {
          await ChatConversation.findByIdAndUpdate(
            conversationId,
            {
              unreadCount: 0,
              $set: { "messages.$[elem].read": true },
            },
            {
              arrayFilters: [{ "elem.read": false, "elem.sender": "customer" }],
            },
          );
        } catch (err) {
          console.error("mark-read error:", err);
        }
      },
    );

    socket.on(
      "close-conversation",
      async (payload: string | { conversationId?: string }) => {
        const conversationId =
          typeof payload === "string" ? payload : payload?.conversationId;
        if (!conversationId) return;
        try {
          await ChatConversation.findByIdAndUpdate(conversationId, {
            status: "closed",
          });
          io.to(`chat-${conversationId}`).emit("conversation-closed", {
            conversationId,
          });
          io.to("admin-chat").emit("conversation-updated", {
            conversationId,
            status: "closed",
          });
        } catch (err) {
          console.error("close-conversation error:", err);
        }
      },
    );

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
