<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDialog } from '@wot-ui/ui/components/wd-dialog'
import { PUNISH_LABEL, PunishAction, ReportStatus } from '@/message/mock'
import { getMessage, getUser, messageState, resolveReport } from '@/message/store'

const resolveDialog = useDialog('message-admin-report')
const activeTab = ref<ReportStatus>('pending')

const pendingCount = computed(() => messageState.reports.filter((report) => report.status === 'pending').length)
const handledCount = computed(() => messageState.reports.filter((report) => report.status === 'handled').length)
const list = computed(() => messageState.reports.filter((report) => report.status === activeTab.value))

function userName(id: string) {
  return getUser(id)?.nickname || '未知用户'
}

function switchTab(tab: ReportStatus) {
  activeTab.value = tab
}

async function handleReport(ticketId: string, targetId: string, action: PunishAction) {
  const label = PUNISH_LABEL[action]
  const target = getUser(targetId)
  try {
    await resolveDialog.confirm({
      title: `确认${label}？`,
      msg: action === 'close'
        ? `工单 ${ticketId} 将标记为已处理，不变更用户账号状态。`
        : `工单 ${ticketId} 将标记为已处理，并对 ${target?.nickname || targetId} 执行“${label}”，立即影响 APP 私信权限。`,
      confirmButtonText: `确认${label}`,
      cancelButtonText: '取消',
      icon: action === 'close' ? 'info' : 'warning'
    })
    resolveReport(ticketId, action)
    uni.showToast({ title: `已${label}`, icon: 'success' })
  } catch { /* 用户取消 */ }
}

function viewConversation(id?: string) {
  if (id) uni.navigateTo({ url: `/pages/message/admin/detail?id=${encodeURIComponent(id)}` })
}

function previewImage(urls: string[], current: string) {
  uni.previewImage({ urls, current })
}
</script>

<template>
  <view class="shell">
    <app-sidebar active="msg-admin-reports" />
    <view class="page">
      <view class="breadcrumb">
        <text>私信管理</text><text class="sep">/</text><text class="cur">举报处理</text>
      </view>
      <view class="page-head">
        <view>
          <text class="page-title">举报处理</text>
          <text class="page-sub">核查用户举报与消息证据 · 待处理 {{ pendingCount }} 条，已处理 {{ handledCount }} 条</text>
        </view>
      </view>

      <view class="tabs-card">
        <view class="tab" :class="{ active: activeTab === 'pending' }" @click="switchTab('pending')">
          <text>待处理</text><text class="tab-count">{{ pendingCount }}</text>
        </view>
        <view class="tab" :class="{ active: activeTab === 'handled' }" @click="switchTab('handled')">
          <text>已处理</text><text class="tab-count">{{ handledCount }}</text>
        </view>
      </view>

      <view v-if="list.length" class="ticket-list">
        <view v-for="ticket in list" :key="ticket.id" class="ticket-card">
          <view class="ticket-head">
            <view class="ticket-title-wrap">
              <text class="ticket-id">{{ ticket.id }}</text>
              <text class="type-tag">{{ ticket.type }}</text>
              <text class="status-tag" :class="{ handled: ticket.status === 'handled' }">
                {{ ticket.status === 'handled' ? '已处理' : '待处理' }}
              </text>
            </view>
            <text class="created-at">举报时间：{{ ticket.createdAt }}</text>
          </view>

          <view class="ticket-body">
            <view class="parties">
              <view class="party">
                <text class="party-label">举报人</text>
                <view class="party-user">
                  <view class="avatar" :style="{ background: getUser(ticket.reporterId)?.avatarColor || '#c9cdd4' }">
                    {{ userName(ticket.reporterId).slice(0, 1) }}
                  </view>
                  <view><text class="party-name">{{ userName(ticket.reporterId) }}</text><text class="party-id">{{ ticket.reporterId }}</text></view>
                </view>
              </view>
              <view class="party-arrow">→</view>
              <view class="party">
                <text class="party-label">被举报人</text>
                <view class="party-user">
                  <view class="avatar" :style="{ background: getUser(ticket.targetId)?.avatarColor || '#c9cdd4' }">
                    {{ userName(ticket.targetId).slice(0, 1) }}
                  </view>
                  <view><text class="party-name">{{ userName(ticket.targetId) }}</text><text class="party-id">{{ ticket.targetId }}</text></view>
                </view>
              </view>
              <text v-if="ticket.conversationId" class="conversation-link" @click="viewConversation(ticket.conversationId)">
                查看会话 {{ ticket.conversationId }}
              </text>
            </view>

            <view class="evidence-box">
              <view class="box-title">关联消息证据</view>
              <block v-if="getMessage(ticket.messageId)">
                <view class="message-meta">
                  <text>{{ userName(getMessage(ticket.messageId)!.senderId) }} · {{ getMessage(ticket.messageId)!.senderId }}</text>
                  <text>{{ getMessage(ticket.messageId)!.sentAt }}</text>
                </view>
                <text class="message-content">{{ getMessage(ticket.messageId)!.text }}</text>
                <text v-if="getMessage(ticket.messageId)!.recalledAt" class="recalled-text">
                  已撤回：{{ getMessage(ticket.messageId)!.recalledAt }}
                </text>
              </block>
              <text v-else class="no-evidence">未关联具体消息，可进入会话核查完整记录</text>
            </view>

            <view class="note-row"><text class="note-label">举报备注</text><text class="note-content">{{ ticket.note || '无补充备注' }}</text></view>
            <view class="screenshot-row">
              <text class="note-label">举报截图</text>
              <view v-if="ticket.screenshots.length" class="screenshots">
                <image
                  v-for="url in ticket.screenshots"
                  :key="url"
                  class="screenshot"
                  :src="url"
                  mode="aspectFill"
                  @click="previewImage(ticket.screenshots, url)"
                />
              </view>
              <text v-else class="no-screenshot">未上传截图</text>
            </view>
          </view>

          <view v-if="ticket.status === 'pending'" class="ticket-actions">
            <text class="action-tip">处理后工单进入已处理，账号处罚立即生效</text>
            <view class="action-buttons">
              <wd-button plain type="primary" size="small" @click="handleReport(ticket.id, ticket.targetId, 'warn')">警告</wd-button>
              <wd-button plain type="primary" size="small" @click="handleReport(ticket.id, ticket.targetId, 'limit')">限制私信</wd-button>
              <wd-button plain type="error" size="small" @click="handleReport(ticket.id, ticket.targetId, 'ban')">封禁账号</wd-button>
              <wd-button type="primary" size="small" @click="handleReport(ticket.id, ticket.targetId, 'close')">标记已处理</wd-button>
            </view>
          </view>

          <view v-else class="records-block">
            <view class="records-title">处理记录 <text>{{ ticket.records.length }} 条</text></view>
            <view v-if="ticket.records.length" class="record-list">
              <view v-for="record in ticket.records" :key="record.id" class="record-item">
                <view class="record-dot" />
                <view class="record-content">
                  <view class="record-head">
                    <text class="record-action">{{ PUNISH_LABEL[record.action] }}</text>
                    <text class="record-operator">{{ record.operator }}</text>
                    <text class="record-time">{{ record.createdAt }}</text>
                  </view>
                  <text class="record-note">{{ record.note || '无处理备注' }}</text>
                </view>
              </view>
            </view>
            <text v-else class="no-record">暂无处理记录</text>
          </view>
        </view>
      </view>

      <view v-else class="empty-card">
        <wd-icon name="check" size="64rpx" color="#c9cdd4" />
        <text class="empty-title">{{ activeTab === 'pending' ? '暂无待处理举报' : '暂无已处理举报' }}</text>
        <text class="empty-desc">{{ activeTab === 'pending' ? '当前举报工单均已处理完成' : '处理举报后，记录会展示在这里' }}</text>
      </view>
    </view>
    <wd-dialog selector="message-admin-report" />
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
.tabs-card { display: flex; gap: 8rpx; margin-bottom: 16rpx; padding: 8rpx; background: #fff; border: 2rpx solid $rule; border-radius: 12rpx; }
.tab { display: flex; align-items: center; justify-content: center; gap: 10rpx; min-width: 190rpx; padding: 14rpx 24rpx; color: $text-2; font-size: 25rpx; border-radius: 8rpx; cursor: pointer; &.active { color: $primary; font-weight: 600; background: $primary-light; } }
.tab-count { display: inline-flex; align-items: center; justify-content: center; min-width: 34rpx; height: 34rpx; padding: 0 8rpx; color: $muted; font-size: 19rpx; background: #f2f3f5; border-radius: 18rpx; box-sizing: border-box; }
.tab.active .tab-count { color: #fff; background: $primary; }
.ticket-list { display: flex; flex-direction: column; gap: 16rpx; }
.ticket-card, .empty-card { background: #fff; border: 2rpx solid $rule; border-radius: 12rpx; }
.ticket-card { overflow: hidden; }
.ticket-head { display: flex; align-items: center; justify-content: space-between; gap: 16rpx; padding: 18rpx 24rpx; background: #fafbfc; border-bottom: 2rpx solid $rule; }
.ticket-title-wrap { display: flex; align-items: center; gap: 10rpx; }
.ticket-id { color: $text-main; font-size: 28rpx; font-weight: 600; }
.type-tag { padding: 3rpx 12rpx; color: #f77234; font-size: 20rpx; background: #fff7e8; border-radius: 4rpx; }
.status-tag { padding: 3rpx 12rpx; color: #f53f3f; font-size: 20rpx; background: #ffece8; border-radius: 20rpx; &.handled { color: #00b42a; background: #e8ffea; } }
.created-at { color: $muted; font-size: 20rpx; }
.ticket-body { padding: 20rpx 24rpx; }
.parties { display: flex; align-items: center; gap: 24rpx; margin-bottom: 18rpx; }
.party { min-width: 220rpx; }
.party-label { display: block; margin-bottom: 8rpx; color: $muted; font-size: 20rpx; }
.party-user { display: flex; align-items: center; gap: 10rpx; }
.avatar { display: flex; align-items: center; justify-content: center; width: 48rpx; height: 48rpx; color: #fff; font-size: 22rpx; border-radius: 50%; }
.party-name { display: block; color: $text-main; font-size: 24rpx; font-weight: 500; }
.party-id { display: block; margin-top: 2rpx; color: $muted; font-size: 18rpx; }
.party-arrow { color: $muted-2; font-size: 26rpx; }
.conversation-link { margin-left: auto; color: $primary; font-size: 22rpx; cursor: pointer; }
.evidence-box { padding: 16rpx 18rpx; background: #f7f8fa; border-left: 4rpx solid $primary; border-radius: 6rpx; }
.box-title { margin-bottom: 10rpx; color: $text-2; font-size: 20rpx; font-weight: 600; }
.message-meta { display: flex; justify-content: space-between; gap: 16rpx; color: $muted; font-size: 19rpx; }
.message-content { display: block; margin-top: 8rpx; color: $text-main; font-size: 24rpx; line-height: 1.6; white-space: pre-wrap; }
.recalled-text { display: block; margin-top: 6rpx; color: #f77234; font-size: 19rpx; }
.no-evidence { color: $muted; font-size: 22rpx; }
.note-row, .screenshot-row { display: flex; align-items: flex-start; gap: 20rpx; margin-top: 16rpx; }
.note-label { flex-shrink: 0; width: 110rpx; color: $muted; font-size: 21rpx; }
.note-content { flex: 1; color: $text-2; font-size: 22rpx; line-height: 1.55; }
.screenshots { display: flex; gap: 10rpx; flex-wrap: wrap; }
.screenshot { width: 132rpx; height: 132rpx; background: #f2f3f5; border-radius: 8rpx; }
.no-screenshot { color: $muted-2; font-size: 21rpx; }
.ticket-actions { display: flex; align-items: center; justify-content: space-between; gap: 16rpx; padding: 16rpx 24rpx; background: #fafbfc; border-top: 2rpx solid $rule; }
.action-tip { color: $muted; font-size: 20rpx; }
.action-buttons { display: flex; gap: 10rpx; flex-wrap: wrap; }
.records-block { padding: 16rpx 24rpx 20rpx; background: #fafbfc; border-top: 2rpx solid $rule; }
.records-title { color: $text-main; font-size: 23rpx; font-weight: 600; text { margin-left: 8rpx; color: $muted; font-size: 19rpx; font-weight: 400; } }
.record-list { margin-top: 12rpx; }
.record-item { display: flex; gap: 12rpx; padding: 10rpx 0; }
.record-dot { flex-shrink: 0; width: 12rpx; height: 12rpx; margin-top: 10rpx; background: $primary; border-radius: 50%; }
.record-content { flex: 1; }
.record-head { display: flex; align-items: center; gap: 12rpx; }
.record-action { padding: 2rpx 10rpx; color: $primary; font-size: 19rpx; background: $primary-light; border-radius: 4rpx; }
.record-operator { color: $text-2; font-size: 20rpx; }
.record-time { margin-left: auto; color: $muted; font-size: 19rpx; }
.record-note { display: block; margin-top: 6rpx; color: $text-2; font-size: 21rpx; }
.no-record { display: block; margin-top: 12rpx; color: $muted; font-size: 21rpx; }
.empty-card { display: flex; flex-direction: column; align-items: center; gap: 14rpx; padding: 80rpx 24rpx; }
.empty-title { color: $text-2; font-size: 27rpx; }
.empty-desc { color: $muted; font-size: 22rpx; }
</style>
