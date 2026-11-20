// 私信模块：类型、常量与演示数据
export type UserStatus = 'normal' | 'warned' | 'limited' | 'banned'
export type MessageStatus = 'sending' | 'failed' | 'delivered'
export type ReportType = '骚扰广告' | '辱骂' | '色情' | '其他'
export type ReportStatus = 'pending' | 'handled'
export type PunishAction = 'warn' | 'limit' | 'ban' | 'close'

export interface User {
  id: string
  nickname: string
  avatarColor: string
  teen: boolean
  allowStranger: boolean
  followingIds: string[]
  status: UserStatus
  signature: string
}

export interface Conversation {
  id: string
  userIds: string[]
  peerReplied: boolean
  strangerSent: number
  unread: number
  muted: boolean
  lastMessage: string
  lastAt: string
  deleted?: boolean
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  text: string
  sentAt: string
  status: MessageStatus
  recalledAt?: string
}

export interface BlockItem {
  id: string
  ownerId: string
  targetId: string
  createdAt: string
}

export interface ReportRecord {
  id: string
  action: PunishAction
  operator: string
  note: string
  createdAt: string
}

export interface ReportTicket {
  id: string
  reporterId: string
  targetId: string
  conversationId?: string
  messageId?: string
  type: ReportType
  note: string
  screenshots: string[]
  status: ReportStatus
  createdAt: string
  records: ReportRecord[]
}

export interface MessageConfig {
  initialLimit: number
  replyBonus: number
  recallSeconds: number
  retentionDays: number
  teenMessageEnabled: boolean
}

export const CURRENT_USER_ID = 'u-me'
export const REPORT_TYPES: ReportType[] = ['骚扰广告', '辱骂', '色情', '其他']
export const USER_STATUS_LABEL: Record<UserStatus, string> = {
  normal: '正常', warned: '已警告', limited: '限制私信', banned: '已封禁'
}
export const PUNISH_LABEL: Record<PunishAction, string> = {
  warn: '警告', limit: '限制私信', ban: '封禁账号', close: '标记已处理'
}

export function pad(n: number) { return n < 10 ? `0${n}` : `${n}` }
export function formatDateTime(input: number | Date) {
  const d = typeof input === 'number' ? new Date(input) : input
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
export function timeAgo(minutes: number) { return formatDateTime(Date.now() - minutes * 60 * 1000) }
export function parseTime(value: string) {
  return new Date(value.replace(/-/g, '/')).getTime()
}
export function formatShortTime(value: string) {
  const time = parseTime(value)
  const d = new Date(time)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  return sameDay
    ? `${pad(d.getHours())}:${pad(d.getMinutes())}`
    : `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function createMockUsers(): User[] {
  return [
    { id: CURRENT_USER_ID, nickname: '小驹骑士', avatarColor: '#165DFF', teen: false, allowStranger: true, followingIds: ['u-2', 'u-3'], status: 'normal', signature: '热爱骑行，记录每一公里' },
    { id: 'u-2', nickname: '林晓', avatarColor: '#00B42A', teen: false, allowStranger: true, followingIds: [CURRENT_USER_ID], status: 'normal', signature: '城市通勤骑行爱好者' },
    { id: 'u-3', nickname: '阿峰', avatarColor: '#722ED1', teen: false, allowStranger: true, followingIds: [CURRENT_USER_ID], status: 'normal', signature: '周末长途，风雨无阻' },
    { id: 'u-4', nickname: '米粒', avatarColor: '#FF7D00', teen: false, allowStranger: true, followingIds: [CURRENT_USER_ID], status: 'normal', signature: '刚入手小驹GO，请多关照' },
    { id: 'u-5', nickname: '陈默', avatarColor: '#86909C', teen: false, allowStranger: false, followingIds: [], status: 'normal', signature: '只和熟悉的人聊天' },
    { id: 'u-6', nickname: '小鹿', avatarColor: '#F53F3F', teen: true, allowStranger: false, followingIds: [], status: 'normal', signature: '青少年模式演示账号' },
    { id: 'u-7', nickname: '星辰大海', avatarColor: '#0FC6C2', teen: false, allowStranger: true, followingIds: [], status: 'normal', signature: '骑行装备交流' }
  ]
}

export function createMockConversations(): Conversation[] {
  return [
    { id: 'c-1', userIds: [CURRENT_USER_ID, 'u-2'], peerReplied: true, strangerSent: 0, unread: 2, muted: false, lastMessage: '周末一起去滨江绿道吗？', lastAt: timeAgo(18) },
    { id: 'c-2', userIds: [CURRENT_USER_ID, 'u-4'], peerReplied: false, strangerSent: 0, unread: 0, muted: false, lastMessage: '暂无消息，发起第一句私信', lastAt: timeAgo(65) },
    { id: 'c-3', userIds: [CURRENT_USER_ID, 'u-7'], peerReplied: true, strangerSent: 1, unread: 1, muted: false, lastMessage: '你好呀，装备问题可以一起交流', lastAt: timeAgo(42) },
    { id: 'c-4', userIds: [CURRENT_USER_ID, 'u-3'], peerReplied: true, strangerSent: 0, unread: 0, muted: true, lastMessage: '这条路线收藏了', lastAt: timeAgo(60 * 26) }
  ]
}

export function createMockMessages(): Message[] {
  return [
    { id: 'm-1', conversationId: 'c-1', senderId: CURRENT_USER_ID, text: '这周天气不错，适合骑车。', sentAt: timeAgo(62), status: 'delivered' },
    { id: 'm-2', conversationId: 'c-1', senderId: 'u-2', text: '是呀，正想约你。', sentAt: timeAgo(55), status: 'delivered' },
    { id: 'm-3', conversationId: 'c-1', senderId: 'u-2', text: '周末一起去滨江绿道吗？', sentAt: timeAgo(18), status: 'delivered' },
    { id: 'm-4', conversationId: 'c-3', senderId: CURRENT_USER_ID, text: '你好，看到你也骑小驹GO，想请教一下续航。', sentAt: timeAgo(90), status: 'delivered' },
    { id: 'm-5', conversationId: 'c-3', senderId: 'u-7', text: '你好呀，装备问题可以一起交流', sentAt: timeAgo(42), status: 'delivered' },
    { id: 'm-6', conversationId: 'c-4', senderId: 'u-3', text: '上次那条山路路线发我一下？', sentAt: timeAgo(60 * 27), status: 'delivered' },
    { id: 'm-7', conversationId: 'c-4', senderId: CURRENT_USER_ID, text: '这条路线收藏了', sentAt: timeAgo(60 * 26), status: 'failed' }
  ]
}

export function createMockReports(): ReportTicket[] {
  return [
    {
      id: 'r-1001', reporterId: CURRENT_USER_ID, targetId: 'u-7', conversationId: 'c-3', messageId: 'm-5',
      type: '骚扰广告', note: '对方后续发送了推广内容，请核查。', screenshots: [], status: 'pending', createdAt: timeAgo(20), records: []
    },
    {
      id: 'r-1002', reporterId: 'u-3', targetId: 'u-5',
      type: '辱骂', note: '评论区引流后私信辱骂。', screenshots: [], status: 'handled', createdAt: timeAgo(60 * 30),
      records: [{ id: 'rr-1', action: 'warn', operator: '审核员-周敏', note: '已警告并持续关注', createdAt: timeAgo(60 * 28) }]
    }
  ]
}

export function createMockConfig(): MessageConfig {
  return { initialLimit: 1, replyBonus: 3, recallSeconds: 120, retentionDays: 180, teenMessageEnabled: true }
}
