/**
 * High-Performance Bidirectional Data Pipeline: CRM <-> Mobile
 * 
 * Architecture Specification & Telemetry Engine using:
 * 1. Redis standard: In-memory cache, Pub/Sub channels, Distributed Locks (Redlock)
 * 2. Kafka / Message Queue: Event-driven decoupled async workers (Mail Dispatcher, Push Worker, Audit Logger)
 */

export interface PipelineMetric {
  name: string;
  value: string | number;
  unit?: string;
  status: "healthy" | "warning" | "optimal";
  description: string;
}

export interface PipelineTopic {
  topic: string;
  partitions: number;
  replicationFactor: number;
  producer: string;
  consumerGroups: string[];
  messagesPerSec: number;
  avgLatencyMs: number;
}

export interface PipelineEventLog {
  id: string;
  timestamp: string;
  direction: "crm_to_mobile" | "mobile_to_crm";
  channel: "redis_pubsub" | "kafka_topic" | "redis_cache";
  topicOrKey: string;
  payloadSnippet: string;
  status: "delivered" | "queued" | "processed";
}

export const KAFKA_TOPICS: PipelineTopic[] = [
  {
    topic: "vione.meeting.booking_requested",
    partitions: 6,
    replicationFactor: 3,
    producer: "Mobile App & Web CRM",
    consumerGroups: ["admin-approval-worker", "email-dispatcher-group"],
    messagesPerSec: 142,
    avgLatencyMs: 4.2,
  },
  {
    topic: "vione.meeting.booking_decided",
    partitions: 6,
    replicationFactor: 3,
    producer: "Web CRM (Admin)",
    consumerGroups: ["mobile-push-worker", "email-confirmation-group", "calendar-sync-worker"],
    messagesPerSec: 88,
    avgLatencyMs: 3.8,
  },
  {
    topic: "vione.event.registration_submitted",
    partitions: 12,
    replicationFactor: 3,
    producer: "Google Form Registration / Mobile",
    consumerGroups: ["crm-db-writer", "ticket-qr-generator", "email-ticket-group"],
    messagesPerSec: 620,
    avgLatencyMs: 6.5,
  },
  {
    topic: "vione.payment.webhook_events",
    partitions: 8,
    replicationFactor: 3,
    producer: "Banking Gateway / VietQR IPN",
    consumerGroups: ["ledger-reconciliation", "invoice-receipt-dispatcher"],
    messagesPerSec: 310,
    avgLatencyMs: 5.1,
  },
  {
    topic: "vione.notification.dispatch_queue",
    partitions: 16,
    replicationFactor: 3,
    producer: "Orchestration Engine",
    consumerGroups: ["multi-channel-notification-worker", "apns-fcm-delivery"],
    messagesPerSec: 1250,
    avgLatencyMs: 2.9,
  },
];

export const REDIS_SPECIFICATION = {
  version: "Redis 7.2 Enterprise / Redis Cluster",
  memoryUsage: "348 MB / 4 GB (8.7%)",
  hitRate: "99.4%",
  activeConnections: 48,
  cachingKeys: [
    { key: "vione:cache:rooms:list", ttl: "3600s", desc: "Danh sách phòng họp & trang thiết bị" },
    { key: "vione:cache:events:active", ttl: "600s", desc: "Danh sách sự kiện đang mở đăng ký" },
    { key: "vione:cache:user:{id}:profile", ttl: "1800s", desc: "Thông tin hội viên & danh thiếp điện tử" },
    { key: "vione:lock:room:booking:{roomId}:{slot}", ttl: "30s", desc: "Distributed Lock chống trùng lịch đặt phòng" },
    { key: "vione:lock:event:seat:{eventId}:{seatId}", ttl: "20s", desc: "Distributed Lock chống tranh chấp bàn tiệc/ghế ngồi" },
  ],
  pubSubChannels: [
    { name: "vione:crm:to:mobile", desc: "Bắn thông báo phê duyệt, lịch họp, thay đổi phòng họp từ Web xuống Mobile" },
    { name: "vione:mobile:to:crm", desc: "Đẩy phiếu đăng ký sự kiện, check-in QR, yêu cầu book phòng từ Mobile lên Web" },
    { name: "vione:sync:association:{id}", desc: "Kênh dữ liệu chung của hiệp hội (tin tức, giao thương B2B)" },
  ],
};

const INITIAL_PIPELINE_LOGS: PipelineEventLog[] = [
  {
    id: "LOG-991",
    timestamp: "10:20:15",
    direction: "mobile_to_crm",
    channel: "kafka_topic",
    topicOrKey: "vione.event.registration_submitted",
    payloadSnippet: "{ regId: 'REG-8819', eventId: 'evt-2026', member: 'Phạm Quang Huy', table: 'VIP-02' }",
    status: "processed",
  },
  {
    id: "LOG-992",
    timestamp: "10:20:18",
    direction: "crm_to_mobile",
    channel: "redis_pubsub",
    topicOrKey: "vione:crm:to:mobile",
    payloadSnippet: "{ action: 'MEETING_APPROVED', bookingId: 'BK-1983-01', room: 'Sapphire VIP' }",
    status: "delivered",
  },
  {
    id: "LOG-993",
    timestamp: "10:21:02",
    direction: "mobile_to_crm",
    channel: "redis_cache",
    topicOrKey: "vione:lock:room:booking:room_sapphire:20260915_1430",
    payloadSnippet: "Acquired distributed lock (token: 9a2b8e), TTL: 30s",
    status: "processed",
  },
  {
    id: "LOG-994",
    timestamp: "10:21:44",
    direction: "crm_to_mobile",
    channel: "kafka_topic",
    topicOrKey: "vione.notification.dispatch_queue",
    payloadSnippet: "{ template: 'EVENT_TICKET_CONFIRMATION', target: 'huy.pham@ceo1983.com', qr: 'TKT-8839-GL' }",
    status: "delivered",
  },
];

export const DataPipelineService = {
  getMetrics(): PipelineMetric[] {
    return [
      { name: "Redis Caching Hit Rate", value: "99.4%", status: "optimal", description: "Tỷ lệ query trúng cache, giải phóng 98% tải database" },
      { name: "Kafka Message Throughput", value: "2,410", unit: "msgs/sec", status: "healthy", description: "Lưu lượng xử lý sự kiện đồng bộ 2 chiều tức thời" },
      { name: "Average End-to-End Latency", value: "4.6", unit: "ms", status: "optimal", description: "Độ trễ trung bình từ Mobile gửi lên CRM và ngược lại" },
      { name: "Active Consumer Workers", value: "8 / 8", status: "healthy", description: "Mail Dispatcher, Push Notification, Reconciler đều trực tuyến" },
      { name: "Dead-Letter Queue (DLQ)", value: 0, status: "optimal", description: "Không có thông điệp lỗi hoặc nghẽn mạng" },
    ];
  },

  getTopics(): PipelineTopic[] {
    return KAFKA_TOPICS;
  },

  getRedisConfig() {
    return REDIS_SPECIFICATION;
  },

  getLogs(): PipelineEventLog[] {
    return INITIAL_PIPELINE_LOGS;
  },

  /**
   * Simulate a bidirectional event publication
   */
  publishEvent(direction: "crm_to_mobile" | "mobile_to_crm", topic: string, payload: string): PipelineEventLog {
    const log: PipelineEventLog = {
      id: `LOG-${Date.now().toString(36).toUpperCase()}`,
      timestamp: new Date().toLocaleTimeString(),
      direction,
      channel: topic.includes(":") ? "redis_pubsub" : "kafka_topic",
      topicOrKey: topic,
      payloadSnippet: payload,
      status: "delivered",
    };
    INITIAL_PIPELINE_LOGS.unshift(log);
    if (INITIAL_PIPELINE_LOGS.length > 20) INITIAL_PIPELINE_LOGS.pop();
    return log;
  },
};
