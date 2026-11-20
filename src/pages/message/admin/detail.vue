<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { PUNISH_LABEL, PunishAction, USER_STATUS_LABEL, User, UserStatus } from '@/message/mock'
import { getConversation, getMessage, getMessages, getPeer, getUser, messageState, punishUser } from '@/message/store'

const punishDialog = useDialog('message-admin-punish')
const conversationId = ref(messageState.conversations[0]?.id || '')

onLoad((options) => {
  const id = typeof options?.id === 'string' ? options.id : ''
  conversationId.value = id && getConversation(id) ? id : (messageState.conversations[0]?.id || '')
})

const conversation = computed(() => getConversation(conversationId.value))
const participants = computed<User[]>(() => {
  if (!conversation.value) return []
  return conversation.value.userIds.map((id) => getUser(id)).filter((user): user is User => !!user)
})
const peer = computed(() => conversation.value ? getPeer(conversation.value) : undefined)
const messages = computed(() => getMessages(conversationId.value))
const relatedReports = computed(() => messageState.reports.filter((report) => report.conversationId === conversationId.value))

const SEND_STATUS_LABEL = { sending: '发送中', failed: '发送失败', delivered: '已送达' } as const

function senderName(id: string) {
  return getUser(id)?.nickname || '未知用户'
}

function statusClass(status: UserStatus) {
  return `status--${status}`
}

async function handlePunish(action: Exclude<PunishAction, 'close'>) {
  if (!peer.value) return
  const target = peer.value
  const label = PUNISH_LABEL[action]
  try {
    await punishDialog.confirm({
      title: `确认${label}？`,
      msg: `将对 ${target.nickname}（${target.id}）执行“${label}”。处罚保存后立即生效，并同步影响 APP 端私信发送权限。`,
      confirmButtonText: `确认${label}`,
      cancelButtonText: '取消',
      icon: 'warning'
    })
    punishUser(target.id, action)
    uni.showToast({ title: `已${label}`, icon: 'success' })
  } catch { /* 用户取消 */ }
}

function previewImage(urls: string[], current: string) {
  uni.previewImage({ urls, current })
}

function backToList() {
  uni.navigateBack({
    fail: () => uni.navigateTo({ url: '/pages/message/admin/conversations' })
  })
}
</script>

<template>
  <view class="shell">
    <app-sidebar active="msg-admin-detail" />
    <view class="page">
      <view class="breadcrumb">
        <text>私信管理</text><text class="sep">/</text><text>会话查询</text><text class="sep">/</text><text class="cur">消息详情</text>
      </view>
      <view class="page-head">
        <view>
          <text class="page-title">消息详情</text>
          <text class="page-sub">会话 {{ conversationId || '—' }} · 完整记录、举报证据与账号处置</text>
        </view>
        <wd-button plain size="small" @click="backToList">返回会话查询</wd-button>
      </view>

      <block v-if="conversation">
        <view class="profile-grid">
          <view v-for="user in participants" :key="user.id" class="profile-card">
            <view class="profile-top">
              <view class="avatar" :style="{ background: user.avatarColor }">{{ user.nickname.slice(0, 1) }}</view>
              <view class="profile-main">
                <view class="name-row">
                  <text class="nickname">{{ user.nickname }}</text>
                  <text v-if="peer && user.id === peer.id" class="peer-tag">对方账号</text>
                </view>
                <text class="user-id">{{ user.id }}</text>
              </view>
              <text class="status-tag" :class="statusClass(user.status)">{{ USER_STATUS_LABEL[user.status] }}</text>
            </view>
            <text class="signature">{{ user.signature || '暂无签名' }}</text>
            <view class="account-meta">
              <text>{{ user.teen ? '青少年账号' : '普通账号' }}</text>
              <text>{{ user.allowStranger ? '接收陌生人私信' : '不接收陌生人私信' }}</text>
            </view>
          </view>
        </view>

        <view v-if="peer" class="punish-card">
          <view class="section-heading punish-heading">
            <view>
              <text class="section-title">对方账号处置</text>
              <text class="section-desc">{{ peer.nickname }} · 当前状态：{{ USER_STATUS_LABEL[peer.status] }}</text>
            </view>
            <text class="effect-tip">处罚即时同步 APP 聊天权限</text>
          </view>
          <view class="punish-actions">
            <wd-button plain type="primary" size="small" @click="handlePunish('warn')">警告</wd-button>
            <wd-button plain type="primary" size="small" @click="handlePunish('limit')">限制私信</wd-button>
            <wd-button plain type="error" size="small" @click="handlePunish('ban')">封禁账号</wd-button>
          </view>
        </view>

        <view class="content-grid">
          <view class="panel chat-panel">
            <view class="section-heading">
              <view>
                <text class="section-title">完整聊天记录</text>
                <text class="section-desc">共 {{ messages.length }} 条 · 按发送时间正序</text>
              </view>
              <text class="retention-tip">保存周期：{{ messageState.config.retentionDays === 0 ? '永久' : `${messageState.config.retentionDays} 天` }}</text>
            </view>
            <scroll-view scroll-y class="chat-list">
              <view v-if="messages.length" class="chat-inner">
                <view
                  v-for="message in messages"
                  :key="message.id"
                  class="message-item"
                  :class="{ right: message.senderId === conversation.userIds[0] }"
                >
                  <view class="message-sender">
                    <text>{{ senderName(message.senderId) }} · {{ message.senderId }}</text>
                    <text>{{ message.sentAt }}</text>
                  </view>
                  <view class="message-bubble" :class="{ recalled: message.recalledAt, failed: message.status === 'failed' }">
                    <text class="message-text">{{ message.text }}</text>
                    <view class="message-flags">
                      <text>{{ SEND_STATUS_LABEL[message.status] }}</text>
                      <text v-if="message.recalledAt" class="recalled-label">已撤回 · {{ message.recalledAt }}</text>
                    </view>
                  </view>
                </view>
              </view>
              <view v-else class="empty-block">
                <wd-icon name="chat" size="56rpx" color="#c9cdd4" />
                <text>当前保存周期内暂无聊天记录</text>
              </view>
            </scroll-view>
          </view>

          <view class="panel evidence-panel">
            <view class="section-heading">
              <view>
                <text class="section-title">关联举报证据</text>
                <text class="section-desc">按当前会话 ID 过滤 · {{ relatedReports.length }} 条</text>
              </view>
            </view>
            <scroll-view scroll-y class="evidence-list">
              <view v-if="relatedReports.length">
                <view v-for="report in relatedReports" :key="report.id" class="evidence-item">
                  <view class="evidence-head">
                    <text class="report-id">{{ report.id }}</text>
                    <text class="report-type">{{ report.type }}</text>
                    <text class="report-status" :class="{ handled: report.status === 'handled' }">
                      {{ report.status === 'handled' ? '已处理' : '待处理' }}
                    </text>
                  </view>
                  <view class="evidence-users">
                    <text>举报人：{{ senderName(report.reporterId) }}</text>
                    <text>被举报人：{{ senderName(report.targetId) }}</text>
                  </view>
                  <view v-if="getMessage(report.messageId)" class="quoted-message">
                    <text class="quote-label">关联消息</text>
                    <text class="quote-text">{{ getMessage(report.messageId)?.text }}</text>
                  </view>
                  <text class="report-note">{{ report.note || '无补充备注' }}</text>
                  <view v-if="report.screenshots.length" class="screenshots">
                    <image
                      v-for="url in report.screenshots"
                      :key="url"
                      class="screenshot"
                      :src="url"
                      mode="aspectFill"
                      @click="previewImage(report.screenshots, url)"
                    />
                  </view>
                  <text v-else class="no-screenshot">未上传截图</text>
                  <text class="report-time">举报时间：{{ report.createdAt }}</text>
                </view>
              </view>
              <view v-else class="empty-block">
                <wd-icon name="file" size="56rpx" color="#c9cdd4" />
                <text>该会话暂无关联举报</text>
              </view>
            </scroll-view>
          </view>
        </view>
      </block>
      <view v-else class="empty-card">
        <wd-icon name="search" size="64rpx" color="#c9cdd4" />
        <text>未找到可查看的会话</text>
        <wd-button plain type="primary" size="small" @click="backToList">返回会话查询</wd-button>
      </view>
    </view>
    <wd-dialog selector="message-admin-punish" />
  </view>
</template>

<style lang="scss" scoped>
$primary: #165DFF; $primary-light: #eef4ff;
$text-main: #1d2129; $text-2: #4e5969; $muted: #86909c; $muted-2: #a9aeb8;
$rule: #e5e6eb; $bg-page: #f7f8fa;

.page { min-height: 100vh; padding: 24rpx 32rpx 40rpx 242rpx; background: $bg-page; box-sizing: border-box; }
.breadcrumb { display: flex; gap: 6rpx; color: $muted; font-size: 24rpx; .sep { color: $muted-2; } .cur { color: $text-main; } }
.page-head { display: flex; align-items: flex-start; justify-content: space-between; margin: 24rpx 0 20rpx; }
.page-title { display: block; color: $text-main; font-size: 44rpx; font-weight: 700; }
.page-sub { display: block; margin-top: 10rpx; color: $muted; font-size: 24rpx; }
.profile-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16rpx; margin-bottom: 16rpx; }
.profile-card, .punish-card, .panel, .empty-card { background: #fff; border: 2rpx solid $rule; border-radius: 12rpx; }
.profile-card { padding: 22rpx 24rpx; }
.profile-top { display: flex; align-items: center; gap: 14rpx; }
.avatar { display: flex; flex-shrink: 0; align-items: center; justify-content: center; width: 72rpx; height: 72rpx; color: #fff; font-size: 30rpx; border-radius: 50%; }
.profile-main { flex: 1; min-width: 0; }
.name-row { display: flex; align-items: center; gap: 8rpx; }
.nickname { color: $text-main; font-size: 28rpx; font-weight: 600; }
.peer-tag { padding: 2rpx 8rpx; color: $primary; font-size: 18rpx; background: $primary-light; border-radius: 4rpx; }
.user-id { display: block; margin-top: 4rpx; color: $muted; font-size: 20rpx; }
.status-tag { flex-shrink: 0; padding: 4rpx 14rpx; color: #00b42a; font-size: 20rpx; background: #e8ffea; border-radius: 20rpx; }
.status--warned { color: #f77234; background: #fff7e8; }
.status--limited { color: #f7b500; background: #fffbe8; }
.status--banned { color: #f53f3f; background: #ffece8; }
.signature { display: block; overflow: hidden; margin-top: 16rpx; color: $text-2; font-size: 22rpx; text-overflow: ellipsis; white-space: nowrap; }
.account-meta { display: flex; gap: 16rpx; flex-wrap: wrap; margin-top: 10rpx; color: $muted; font-size: 19rpx; }
.punish-card { display: flex; align-items: center; justify-content: space-between; gap: 20rpx; margin-bottom: 16rpx; padding: 18rpx 24rpx; }
.punish-heading { flex: 1; margin-bottom: 0; padding-bottom: 0; border-bottom: 0; }
.effect-tip { color: #f77234; font-size: 20rpx; }
.punish-actions { display: flex; flex-shrink: 0; gap: 10rpx; }
.content-grid { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(360rpx, 0.8fr); gap: 16rpx; align-items: start; }
.panel { min-width: 0; padding: 20rpx 24rpx; }
.section-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 12rpx; margin-bottom: 16rpx; padding-bottom: 14rpx; border-bottom: 2rpx solid $rule; }
.section-title { display: block; color: $text-main; font-size: 28rpx; font-weight: 600; }
.section-desc { display: block; margin-top: 6rpx; color: $muted; font-size: 20rpx; }
.retention-tip { flex-shrink: 0; color: $muted; font-size: 20rpx; }
.chat-list { height: 760rpx; background: #f7f8fa; border-radius: 10rpx; }
.chat-inner { padding: 22rpx; }
.message-item { display: flex; flex-direction: column; align-items: flex-start; margin-bottom: 22rpx; &.right { align-items: flex-end; } }
.message-sender { display: flex; gap: 12rpx; margin-bottom: 8rpx; color: $muted; font-size: 18rpx; }
.message-bubble { max-width: 82%; padding: 14rpx 16rpx 10rpx; background: #fff; border: 2rpx solid $rule; border-radius: 4rpx 14rpx 14rpx 14rpx; }
.message-item.right .message-bubble { background: $primary-light; border-color: #bed7ff; border-radius: 14rpx 4rpx 14rpx 14rpx; }
.message-bubble.failed { border-color: #f53f3f; }
.message-bubble.recalled { background: #f2f3f5; border-color: $rule; }
.message-text { color: $text-main; font-size: 24rpx; line-height: 1.6; white-space: pre-wrap; word-break: break-all; }
.message-bubble.recalled .message-text { color: $muted; text-decoration: line-through; }
.message-flags { display: flex; gap: 10rpx; flex-wrap: wrap; margin-top: 8rpx; color: $muted; font-size: 18rpx; }
.recalled-label { color: #f77234; }
.evidence-list { height: 760rpx; }
.evidence-item { padding: 16rpx 0; border-bottom: 2rpx solid #f2f3f5; &:last-child { border-bottom: 0; } }
.evidence-head { display: flex; align-items: center; gap: 8rpx; }
.report-id { color: $text-main; font-size: 24rpx; font-weight: 600; }
.report-type { padding: 2rpx 10rpx; color: #f77234; font-size: 18rpx; background: #fff7e8; border-radius: 4rpx; }
.report-status { margin-left: auto; color: #f53f3f; font-size: 20rpx; &.handled { color: #00b42a; } }
.evidence-users { display: flex; gap: 12rpx; flex-wrap: wrap; margin-top: 12rpx; color: $text-2; font-size: 20rpx; }
.quoted-message { margin-top: 12rpx; padding: 12rpx; background: #f7f8fa; border-left: 4rpx solid $primary; border-radius: 4rpx; }
.quote-label { display: block; color: $muted; font-size: 18rpx; }
.quote-text { display: block; margin-top: 6rpx; color: $text-2; font-size: 21rpx; line-height: 1.5; }
.report-note { display: block; margin-top: 12rpx; color: $text-main; font-size: 22rpx; line-height: 1.55; }
.screenshots { display: flex; gap: 10rpx; flex-wrap: wrap; margin-top: 12rpx; }
.screenshot { width: 140rpx; height: 140rpx; background: #f2f3f5; border-radius: 8rpx; }
.no-screenshot { display: block; margin-top: 10rpx; color: $muted-2; font-size: 19rpx; }
.report-time { display: block; margin-top: 10rpx; color: $muted; font-size: 18rpx; }
.empty-block, .empty-card { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14rpx; color: $muted; font-size: 22rpx; }
.empty-block { min-height: 300rpx; }
.empty-card { margin-top: 20rpx; padding: 80rpx 24rpx; }
</style>
