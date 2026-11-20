<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { formatShortTime, Message, parseTime } from '@/message/mock'
import {
  canRecall, canSend, currentUser, getConversation, getMessages, getPeer, isFollowing,
  recallMessage, retryMessage, SendCheck, sendMessage, simulatePeerReply, toggleFollow
} from '@/message/store'

const conversationId = ref('')
const draft = ref('')
const scrollTarget = ref('')
const me = computed(() => currentUser())
const conversation = computed(() => getConversation(conversationId.value))
const peer = computed(() => conversation.value ? getPeer(conversation.value, me.value.id) : undefined)
const messages = computed(() => conversationId.value ? getMessages(conversationId.value) : [])
const check = computed<SendCheck>(() => conversation.value
  ? canSend(conversation.value, me.value.id)
  : { ok: false, reason: '会话不存在或已删除', remaining: 0, mutual: false, stranger: true })
const following = computed(() => !!peer.value && isFollowing(me.value.id, peer.value.id))
const exhausted = computed(() => check.value.reason === '消息次数已用完，互关后可以继续聊天')
const showStrangerQuota = computed(() => !!peer.value && !me.value.teen && !peer.value.teen
  && !check.value.mutual && peer.value.allowStranger && !check.value.reason.includes('拉黑'))
const strangerNotice = computed(() => {
  if (!conversation.value || !showStrangerQuota.value) return ''
  if (exhausted.value) return '消息次数已用完，互关后可以继续聊天'
  if (!conversation.value.peerReplied) return `对方还不是你的好友，仅可发起${check.value.remaining}条消息`
  return `对方已回复，你还可以发送${check.value.remaining}条消息，互关后可自由聊天`
})
const inputPlaceholder = computed(() => {
  if (exhausted.value) return '消息次数已用完，互关后可以继续聊天'
  if (!check.value.ok) return check.value.reason
  return '说点什么…'
})
const followText = computed(() => check.value.mutual ? '已互关' : following.value ? '已关注' : '关注')

onLoad((options) => {
  conversationId.value = options?.id || getConversation('c-2')?.id || ''
  if (conversation.value) conversation.value.unread = 0
  scrollToBottom()
})
watch(() => messages.value.length, scrollToBottom)

function scrollToBottom() {
  nextTick(() => {
    setTimeout(() => {
      const last = messages.value[messages.value.length - 1]
      if (last) scrollTarget.value = `message-${last.id}`
    }, 30)
  })
}
function shouldShowTime(message: Message, index: number) {
  if (index === 0) return true
  return parseTime(message.sentAt) - parseTime(messages.value[index - 1].sentAt) >= 5 * 60 * 1000
}
function senderOf(message: Message) {
  return message.senderId === me.value.id ? me.value : peer.value
}
function submitMessage() {
  const content = draft.value.trim()
  if (!content || !conversation.value) return
  if (!check.value.ok) {
    uni.showToast({ title: check.value.reason, icon: 'none' })
    return
  }
  const message = sendMessage(conversation.value.id, content)
  if (message) {
    draft.value = ''
    scrollToBottom()
  }
}
function retry(message: Message) {
  if (message.status === 'failed') retryMessage(message.id)
}
function openMessageActions(message: Message) {
  if (message.recalledAt || !peer.value || !conversation.value) return
  const actions: Array<{ label: string; run: () => void }> = []
  if (canRecall(message)) {
    actions.push({
      label: '撤回消息',
      run: () => {
        if (recallMessage(message.id)) uni.showToast({ title: '消息已撤回', icon: 'none' })
        else uni.showToast({ title: '已超过可撤回时间', icon: 'none' })
      }
    })
  }
  actions.push({ label: '举报', run: () => reportMessage(message) })
  uni.showActionSheet({
    itemList: actions.map((item) => item.label),
    success: (result) => actions[result.tapIndex]?.run()
  })
}
function reportMessage(message: Message) {
  if (!peer.value || !conversation.value) return
  const query = `targetId=${encodeURIComponent(peer.value.id)}&messageId=${encodeURIComponent(message.id)}&conversationId=${encodeURIComponent(conversation.value.id)}`
  uni.navigateTo({ url: `/pages/message/app/report?${query}` })
}
function changeFollow() {
  if (!peer.value) return
  toggleFollow(peer.value.id)
  uni.showToast({ title: check.value.mutual ? '已互关，可自由聊天' : '关注状态已更新', icon: 'none' })
}
function replyDemo() {
  if (!conversation.value) return
  const replied = simulatePeerReply(conversation.value.id)
  if (!replied) {
    uni.showToast({ title: '对方已被限制或封禁，无法回复', icon: 'none' })
    return
  }
  scrollToBottom()
}
function toggleTeen() {
  me.value.teen = !me.value.teen
}
function goBack() {
  uni.navigateBack({
    fail: () => uni.reLaunch({ url: '/pages/message/app/conversations' })
  })
}
</script>

<template>
  <view class="shell">
    <app-sidebar active="msg-app-chat" />
    <view class="page">
      <view class="breadcrumb">
        <text>私信管理</text><text class="sep">/</text><text>APP 演示</text><text class="sep">/</text><text class="cur">聊天详情</text>
      </view>
      <view class="page-head">
        <view>
          <text class="page-title">私信聊天</text>
          <text class="page-sub">消息状态、陌生人额度与青少年权限实时演示</text>
        </view>
        <view class="head-btns">
          <wd-button plain type="primary" size="small" @click="replyDemo">模拟对方回复</wd-button>
          <wd-button plain size="small" @click="toggleTeen">切换当前账号青少年</wd-button>
        </view>
      </view>

      <view class="demo-stage">
        <phone-demo>
          <view v-if="conversation && peer" class="app-screen">
            <view class="chat-nav">
              <text class="back" @click="goBack">返回</text>
              <view class="peer-summary">
                <view class="mini-avatar" :style="{ backgroundColor: peer.avatarColor }">{{ peer.nickname.charAt(0) }}</view>
                <view class="peer-text">
                  <text class="peer-name">{{ peer.nickname }}</text>
                  <text class="peer-relation">{{ check.mutual ? '互关好友' : '陌生人' }}</text>
                </view>
              </view>
              <view class="follow-button" :class="{ active: following }" @click="changeFollow">{{ followText }}</view>
            </view>

            <scroll-view scroll-y class="message-scroll" :scroll-into-view="scrollTarget">
              <view class="message-list">
                <view v-if="!messages.length" class="message-empty">暂无消息，发起第一句私信吧</view>
                <block v-for="(message, index) in messages" :key="message.id">
                  <view v-if="shouldShowTime(message, index)" class="time-divider">{{ formatShortTime(message.sentAt) }}</view>
                  <view v-if="message.recalledAt" :id="`message-${message.id}`" class="recalled">
                    {{ message.senderId === me.id ? '你撤回了一条消息' : '对方撤回了一条消息' }}
                  </view>
                  <view
                    v-else
                    :id="`message-${message.id}`"
                    class="message-row"
                    :class="{ own: message.senderId === me.id }"
                  >
                    <view class="message-avatar" :style="{ backgroundColor: senderOf(message)?.avatarColor }">
                      {{ senderOf(message)?.nickname.charAt(0) }}
                    </view>
                    <view class="message-content">
                      <view class="bubble" @longpress="openMessageActions(message)">{{ message.text }}</view>
                      <text
                        v-if="message.senderId === me.id"
                        class="message-status"
                        :class="message.status"
                        @click="retry(message)"
                      >
                        {{ message.status === 'sending' ? '发送中' : message.status === 'failed' ? '发送失败，点击重试' : '已送达' }}
                      </text>
                    </view>
                  </view>
                </block>
              </view>
            </scroll-view>

            <view v-if="strangerNotice" class="stranger-notice" :class="{ exhausted }">{{ strangerNotice }}</view>
            <view v-else-if="!check.ok" class="restriction-notice">{{ check.reason }}</view>
            <view class="composer" :class="{ disabled: !check.ok }">
              <input
                v-model="draft"
                class="message-input"
                :disabled="!check.ok"
                :placeholder="inputPlaceholder"
                placeholder-style="color:#a9aeb8"
                confirm-type="send"
                @confirm="submitMessage"
              />
              <view class="send-button" :class="{ disabled: !check.ok || !draft.trim() }" @click="submitMessage">发送</view>
            </view>
          </view>
          <view v-else class="missing-state">
            <text>会话不存在或已删除</text>
            <text class="missing-back" @click="goBack">返回会话列表</text>
          </view>
        </phone-demo>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page { min-height: 100vh; padding: 24rpx 32rpx 40rpx 242rpx; box-sizing: border-box; background: #f7f8fa; }
.breadcrumb { display: flex; gap: 6rpx; color: #86909c; font-size: 24rpx; .sep { color: #c9cdd4; } .cur { color: #1d2129; } }
.page-head { display: flex; justify-content: space-between; align-items: flex-start; margin: 24rpx 0 20rpx; }
.page-title { display: block; color: #1d2129; font-size: 44rpx; font-weight: 700; }
.page-sub { display: block; margin-top: 10rpx; color: #86909c; font-size: 24rpx; }
.head-btns { display: flex; gap: 16rpx; }
.demo-stage { display: flex; justify-content: center; padding: 12rpx 0 32rpx; }

.app-screen { height: 100%; display: flex; flex-direction: column; background: #f7f8fa; color: #1d2129; }
.chat-nav { height: 64px; flex-shrink: 0; padding: 0 14px; box-sizing: border-box; display: flex; align-items: center; background: #fff; border-bottom: 1px solid #f2f3f5; }
.back { width: 44px; flex-shrink: 0; color: #4e5969; font-size: 12px; }
.peer-summary { flex: 1; min-width: 0; display: flex; align-items: center; justify-content: center; }
.mini-avatar { width: 34px; height: 34px; flex-shrink: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 14px; font-weight: 600; }
.peer-text { min-width: 0; margin-left: 8px; }
.peer-name { display: block; max-width: 100px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font-size: 14px; font-weight: 600; }
.peer-relation { display: block; margin-top: 2px; color: #86909c; font-size: 9px; }
.follow-button { min-width: 48px; height: 26px; box-sizing: border-box; padding: 0 9px; border: 1px solid #165DFF; border-radius: 14px; color: #165DFF; font-size: 11px; line-height: 24px; text-align: center; }
.follow-button.active { color: #4e5969; border-color: #d8dbe0; background: #f7f8fa; }
.message-scroll { flex: 1; min-height: 0; }
.message-list { padding: 14px 14px 20px; box-sizing: border-box; }
.message-empty { padding: 80px 0; color: #a9aeb8; font-size: 12px; text-align: center; }
.time-divider { margin: 8px 0 16px; color: #a9aeb8; font-size: 10px; text-align: center; }
.message-row { margin-bottom: 16px; display: flex; align-items: flex-start; }
.message-row.own { flex-direction: row-reverse; }
.message-avatar { width: 34px; height: 34px; flex-shrink: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 13px; }
.message-content { max-width: 72%; margin: 0 9px; display: flex; flex-direction: column; align-items: flex-start; }
.own .message-content { align-items: flex-end; }
.bubble { padding: 10px 12px; border-radius: 4px 14px 14px 14px; color: #1d2129; background: #fff; box-shadow: 0 1px 3px rgba(29, 33, 41, 0.04); font-size: 13px; line-height: 20px; word-break: break-all; }
.own .bubble { border-radius: 14px 4px 14px 14px; color: #fff; background: #165DFF; }
.message-status { margin-top: 5px; color: #a9aeb8; font-size: 9px; }
.message-status.failed { color: #f53f3f; }
.recalled { margin: 10px 0 16px; color: #a9aeb8; font-size: 10px; text-align: center; }
.stranger-notice, .restriction-notice { flex-shrink: 0; padding: 8px 14px; box-sizing: border-box; color: #b25f00; background: #fff7e8; border-top: 1px solid #ffefd1; font-size: 11px; line-height: 17px; text-align: center; }
.stranger-notice.exhausted { color: #f53f3f; background: #fff1f0; border-color: #ffe1df; }
.restriction-notice { color: #86909c; background: #f2f3f5; border-color: #e5e6eb; }
.composer { flex-shrink: 0; padding: 10px 12px calc(10px + env(safe-area-inset-bottom)); box-sizing: border-box; display: flex; align-items: center; gap: 9px; background: #fff; border-top: 1px solid #e5e6eb; }
.composer.disabled { background: #f7f8fa; }
.message-input { flex: 1; min-width: 0; height: 38px; padding: 0 12px; box-sizing: border-box; border-radius: 19px; color: #1d2129; background: #f2f3f5; font-size: 12px; }
.composer.disabled .message-input { color: #a9aeb8; background: #e5e6eb; }
.send-button { width: 54px; height: 34px; flex-shrink: 0; border-radius: 17px; color: #fff; background: #165DFF; font-size: 12px; line-height: 34px; text-align: center; }
.send-button.disabled { color: #a9aeb8; background: #e5e6eb; }
.missing-state { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; color: #86909c; font-size: 14px; }
.missing-back { color: #165DFF; font-size: 12px; }
</style>
