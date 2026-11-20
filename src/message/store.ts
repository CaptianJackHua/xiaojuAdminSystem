import { reactive, watch } from 'vue'
import {
  BlockItem, Conversation, CURRENT_USER_ID, formatDateTime, Message, MessageConfig,
  parseTime, PunishAction, ReportTicket, ReportType, User,
  createMockConversations, createMockMessages, createMockReports, createMockUsers, createMockConfig
} from './mock'

const STORAGE_KEY = 'xj-message-demo-v1'

export interface MessageState {
  users: User[]
  conversations: Conversation[]
  messages: Message[]
  blocks: BlockItem[]
  reports: ReportTicket[]
  config: MessageConfig
  currentUserId: string
}

export interface SendCheck {
  ok: boolean
  reason: string
  remaining: number
  mutual: boolean
  stranger: boolean
}

function createInitialState(): MessageState {
  return {
    users: createMockUsers(),
    conversations: createMockConversations(),
    messages: createMockMessages(),
    blocks: [],
    reports: createMockReports(),
    config: createMockConfig(),
    currentUserId: CURRENT_USER_ID
  }
}

function loadState(): MessageState {
  try {
    const cached = uni.getStorageSync(STORAGE_KEY)
    if (cached) {
      const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached
      if (parsed?.users && parsed?.conversations && parsed?.messages && parsed?.config) return parsed
    }
  } catch { /* 缓存异常时使用初始数据 */ }
  return createInitialState()
}

export const messageState = reactive<MessageState>(loadState())

watch(messageState, (value) => {
  try { uni.setStorageSync(STORAGE_KEY, JSON.stringify(value)) } catch { /* 忽略存储失败 */ }
}, { deep: true })

export function resetMessageDemo() {
  Object.assign(messageState, createInitialState())
}

export function getUser(id: string) {
  return messageState.users.find((u) => u.id === id)
}
export function currentUser() { return getUser(messageState.currentUserId)! }
export function getConversation(id: string) {
  return messageState.conversations.find((c) => c.id === id)
}
export function getPeer(conversation: Conversation, viewerId = messageState.currentUserId) {
  const peerId = conversation.userIds.find((id) => id !== viewerId) || conversation.userIds[0]
  return getUser(peerId)
}
export function getMessage(id?: string) {
  return id ? messageState.messages.find((m) => m.id === id) : undefined
}

export function isFollowing(ownerId: string, targetId: string) {
  return !!getUser(ownerId)?.followingIds.includes(targetId)
}
export function isMutual(a: string, b: string) {
  return isFollowing(a, b) && isFollowing(b, a)
}
export function toggleFollow(targetId: string) {
  const me = currentUser()
  const index = me.followingIds.indexOf(targetId)
  if (index === -1) me.followingIds.push(targetId)
  else me.followingIds.splice(index, 1)
}

export function isBlocked(a: string, b: string) {
  return messageState.blocks.some((item) =>
    (item.ownerId === a && item.targetId === b) || (item.ownerId === b && item.targetId === a)
  )
}
export function blockUser(ownerId: string, targetId: string) {
  if (isBlocked(ownerId, targetId)) return
  messageState.blocks.push({ id: `b-${Date.now()}`, ownerId, targetId, createdAt: formatDateTime(Date.now()) })
}
export function unblockUser(ownerId: string, targetId: string) {
  const index = messageState.blocks.findIndex((item) => item.ownerId === ownerId && item.targetId === targetId)
  if (index !== -1) messageState.blocks.splice(index, 1)
}

export function getMessages(conversationId: string) {
  const retention = messageState.config.retentionDays
  const oldest = retention > 0 ? Date.now() - retention * 24 * 60 * 60 * 1000 : 0
  return messageState.messages
    .filter((m) => m.conversationId === conversationId && (!oldest || parseTime(m.sentAt) >= oldest))
    .sort((a, b) => parseTime(a.sentAt) - parseTime(b.sentAt))
}

export function getRemaining(conversation: Conversation, senderId = messageState.currentUserId) {
  const peer = getPeer(conversation, senderId)
  if (!peer || isMutual(senderId, peer.id)) return -1
  const total = messageState.config.initialLimit + (conversation.peerReplied ? messageState.config.replyBonus : 0)
  return Math.max(0, total - conversation.strangerSent)
}

export function canSend(conversation: Conversation, senderId = messageState.currentUserId): SendCheck {
  const sender = getUser(senderId)
  const peer = getPeer(conversation, senderId)
  const mutual = !!sender && !!peer && isMutual(senderId, peer.id)
  const base = { remaining: getRemaining(conversation, senderId), mutual, stranger: !mutual }
  if (!sender || !peer) return { ...base, ok: false, reason: '会话用户不存在' }
  if (isBlocked(senderId, peer.id)) {
    const selfBlocked = messageState.blocks.some((b) => b.ownerId === senderId && b.targetId === peer.id)
    return { ...base, ok: false, reason: selfBlocked ? '你已拉黑对方，解除拉黑后才能发消息' : '对方已将你拉黑，无法发送消息' }
  }
  if (sender.status === 'banned') return { ...base, ok: false, reason: '账号已被封禁，无法发送私信' }
  if (sender.status === 'limited') return { ...base, ok: false, reason: '账号已被限制私信，暂时无法发送' }
  if (peer.status === 'banned') return { ...base, ok: false, reason: '对方账号已被封禁，无法接收私信' }
  const teenInvolved = sender.teen || peer.teen
  if (teenInvolved && !messageState.config.teenMessageEnabled) {
    return { ...base, ok: false, reason: '青少年模式已关闭私信功能' }
  }
  if (teenInvolved && !mutual) {
    return { ...base, ok: false, reason: sender.teen ? '青少年模式仅支持与互关好友私信' : '青少年账号仅接收互关好友消息' }
  }
  if (mutual) return { ...base, ok: true, reason: '' }
  if (!peer.allowStranger) return { ...base, ok: false, reason: '对方不接收陌生人消息' }
  if (base.remaining <= 0) return { ...base, ok: false, reason: '消息次数已用完，互关后可以继续聊天' }
  return { ...base, ok: true, reason: '' }
}

function touchConversation(conversation: Conversation, text: string) {
  conversation.lastMessage = text
  conversation.lastAt = formatDateTime(Date.now())
}

export function sendMessage(conversationId: string, text: string) {
  const conversation = getConversation(conversationId)
  const content = text.trim()
  if (!conversation || !content) return null
  const check = canSend(conversation)
  if (!check.ok) return null
  const message: Message = {
    id: `m-${Date.now()}`, conversationId, senderId: messageState.currentUserId,
    text: content, sentAt: formatDateTime(Date.now()), status: 'sending'
  }
  messageState.messages.push(message)
  if (!check.mutual) conversation.strangerSent += 1
  touchConversation(conversation, content)
  setTimeout(() => {
    const target = getMessage(message.id)
    if (target && target.status === 'sending') target.status = 'delivered'
  }, 600)
  return message
}

export function retryMessage(messageId: string) {
  const message = getMessage(messageId)
  if (!message || message.senderId !== messageState.currentUserId || message.status !== 'failed') return
  message.status = 'sending'
  setTimeout(() => {
    const target = getMessage(messageId)
    if (target && target.status === 'sending') target.status = 'delivered'
  }, 600)
}

export function simulatePeerReply(conversationId: string) {
  const conversation = getConversation(conversationId)
  const peer = conversation ? getPeer(conversation) : undefined
  if (!conversation || !peer) return false
  if (peer.status === 'limited' || peer.status === 'banned') return false
  const text = '收到啦，我们可以继续聊聊~'
  messageState.messages.push({
    id: `m-${Date.now()}`, conversationId, senderId: peer.id,
    text, sentAt: formatDateTime(Date.now()), status: 'delivered'
  })
  conversation.peerReplied = true
  touchConversation(conversation, text)
  return true
}

export function canRecall(message: Message) {
  if (message.senderId !== messageState.currentUserId || message.recalledAt || message.status !== 'delivered') return false
  return Date.now() - parseTime(message.sentAt) <= messageState.config.recallSeconds * 1000
}
export function recallMessage(messageId: string) {
  const message = getMessage(messageId)
  if (!message || !canRecall(message)) return false
  message.recalledAt = formatDateTime(Date.now())
  const conversation = getConversation(message.conversationId)
  if (conversation && conversation.lastMessage === message.text) touchConversation(conversation, '你撤回了一条消息')
  return true
}

export function getOrCreateConversation(peerId: string) {
  const existing = messageState.conversations.find((c) => !c.deleted && c.userIds.includes(messageState.currentUserId) && c.userIds.includes(peerId))
  if (existing) return existing
  const conversation: Conversation = {
    id: `c-${Date.now()}`, userIds: [messageState.currentUserId, peerId], peerReplied: false,
    strangerSent: 0, unread: 0, muted: false, lastMessage: '暂无消息，发起第一句私信', lastAt: formatDateTime(Date.now())
  }
  messageState.conversations.unshift(conversation)
  return conversation
}

export function deleteConversation(conversationId: string) {
  const conversation = getConversation(conversationId)
  if (conversation) conversation.deleted = true
}

export interface ReportInput {
  reporterId?: string
  targetId: string
  conversationId?: string
  messageId?: string
  type: ReportType
  note: string
  screenshots: string[]
}
export function createReport(input: ReportInput) {
  const ticket: ReportTicket = {
    id: `r-${Date.now()}`, reporterId: input.reporterId || messageState.currentUserId,
    targetId: input.targetId, conversationId: input.conversationId, messageId: input.messageId,
    type: input.type, note: input.note.trim(), screenshots: [...input.screenshots],
    status: 'pending', createdAt: formatDateTime(Date.now()), records: []
  }
  messageState.reports.unshift(ticket)
  return ticket
}

export function punishUser(userId: string, action: Exclude<PunishAction, 'close'>) {
  const user = getUser(userId)
  if (!user) return
  user.status = action === 'warn' ? 'warned' : action === 'limit' ? 'limited' : 'banned'
}

export function resolveReport(ticketId: string, action: PunishAction, note = '') {
  const ticket = messageState.reports.find((r) => r.id === ticketId)
  if (!ticket) return
  ticket.status = 'handled'
  ticket.records.push({
    id: `rr-${Date.now()}`, action, operator: '审核员-周敏',
    note: note || '后台审核处理', createdAt: formatDateTime(Date.now())
  })
  if (action !== 'close') punishUser(ticket.targetId, action)
}
