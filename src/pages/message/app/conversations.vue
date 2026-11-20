<script setup lang="ts">
import { computed } from 'vue'
import { Conversation, formatShortTime, parseTime } from '@/message/mock'
import {
  blockUser, currentUser, deleteConversation, getPeer, isMutual, messageState
} from '@/message/store'

const me = computed(() => currentUser())
const conversations = computed(() => messageState.conversations
  .filter((item) => !item.deleted && item.userIds.includes(me.value.id) && getPeer(item, me.value.id))
  .slice()
  .sort((a, b) => parseTime(b.lastAt) - parseTime(a.lastAt)))

function peerOf(conversation: Conversation) {
  return getPeer(conversation, me.value.id)
}
function isFriend(conversation: Conversation) {
  const peer = peerOf(conversation)
  return !!peer && isMutual(me.value.id, peer.id)
}
function openConversation(conversation: Conversation) {
  conversation.unread = 0
  uni.navigateTo({ url: `/pages/message/app/chat?id=${conversation.id}` })
}
function removeConversation(conversation: Conversation) {
  deleteConversation(conversation.id)
  uni.showToast({ title: '会话已删除', icon: 'none' })
}
function blockPeer(conversation: Conversation) {
  const peer = peerOf(conversation)
  if (!peer) return
  blockUser(me.value.id, peer.id)
  uni.showToast({ title: '已屏蔽，可在拉黑列表解除', icon: 'none' })
}
</script>

<template>
  <view class="shell">
    <app-sidebar active="msg-app-conversations" />
    <view class="page">
      <view class="breadcrumb">
        <text>私信管理</text><text class="sep">/</text><text>APP 演示</text><text class="sep">/</text><text class="cur">私信会话</text>
      </view>
      <view class="page-head">
        <view>
          <text class="page-title">APP 私信</text>
          <text class="page-sub">会话、陌生人消息与好友关系演示</text>
        </view>
      </view>

      <view class="demo-stage">
        <phone-demo>
          <view class="app-screen">
            <view class="mobile-title">
              <text class="mobile-heading">私信</text>
              <text class="mobile-caption">{{ conversations.length }} 个会话</text>
            </view>
            <scroll-view scroll-y class="conversation-scroll">
              <view v-if="conversations.length" class="conversation-list">
                <wd-swipe-action
                  v-for="conversation in conversations"
                  :key="conversation.id"
                >
                  <view class="conversation-item" @click="openConversation(conversation)">
                    <view class="avatar" :style="{ backgroundColor: peerOf(conversation)?.avatarColor }">
                      {{ peerOf(conversation)?.nickname.charAt(0) }}
                    </view>
                    <view class="conversation-main">
                      <view class="conversation-top">
                        <text class="nickname">{{ peerOf(conversation)?.nickname }}</text>
                        <text class="relation" :class="{ friend: isFriend(conversation) }">
                          {{ isFriend(conversation) ? '好友' : '陌生人' }}
                        </text>
                        <text class="time">{{ formatShortTime(conversation.lastAt) }}</text>
                      </view>
                      <view class="conversation-bottom">
                        <text class="preview">{{ conversation.lastMessage }}</text>
                        <view v-if="conversation.unread" class="unread">{{ conversation.unread > 99 ? '99+' : conversation.unread }}</view>
                      </view>
                    </view>
                    <view class="mute-control" @click.stop>
                      <wd-switch v-model="conversation.muted" size="18px" color="#165DFF" />
                      <text>免打扰</text>
                    </view>
                  </view>
                  <template #right>
                    <view class="swipe-actions">
                      <view class="swipe-button delete" @click.stop="removeConversation(conversation)">删除会话</view>
                      <view class="swipe-button block" @click.stop="blockPeer(conversation)">屏蔽用户</view>
                    </view>
                  </template>
                </wd-swipe-action>
              </view>
              <view v-else class="empty-state">
                <view class="empty-symbol"><view /><view /></view>
                <text class="empty-title">暂无私信会话</text>
                <text class="empty-desc">去用户主页发起第一句私信吧</text>
              </view>
            </scroll-view>
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
.demo-stage { display: flex; justify-content: center; padding: 12rpx 0 32rpx; }

.app-screen { height: 100%; display: flex; flex-direction: column; background: #f7f8fa; color: #1d2129; }
.mobile-title { height: 60px; flex-shrink: 0; padding: 0 18px; box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; background: #fff; border-bottom: 1px solid #f2f3f5; }
.mobile-heading { font-size: 22px; line-height: 28px; font-weight: 700; }
.mobile-caption { color: #86909c; font-size: 12px; }
.conversation-scroll { flex: 1; min-height: 0; }
.conversation-list { background: #fff; }
.conversation-item { width: 100%; height: 84px; flex-shrink: 0; box-sizing: border-box; padding: 14px 14px 14px 16px; display: flex; align-items: center; background: #fff; border-bottom: 1px solid #f2f3f5; }
.conversation-item:active { background: #f7f8fa; }
.avatar { width: 48px; height: 48px; flex-shrink: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 19px; font-weight: 600; }
.conversation-main { flex: 1; min-width: 0; margin-left: 12px; }
.conversation-top { display: flex; align-items: center; min-width: 0; }
.nickname { max-width: 94px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: #1d2129; font-size: 15px; font-weight: 600; }
.relation { flex-shrink: 0; margin-left: 6px; padding: 1px 5px; border-radius: 3px; color: #86909c; background: #f2f3f5; font-size: 9px; line-height: 14px; }
.relation.friend { color: #165DFF; background: #eaf1ff; }
.time { flex-shrink: 0; margin-left: auto; color: #a9aeb8; font-size: 10px; }
.conversation-bottom { margin-top: 7px; display: flex; align-items: center; }
.preview { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; color: #86909c; font-size: 12px; line-height: 18px; }
.unread { min-width: 16px; height: 16px; box-sizing: border-box; margin-left: 6px; padding: 0 4px; border-radius: 9px; color: #fff; background: #f53f3f; font-size: 9px; line-height: 16px; text-align: center; }
.mute-control { width: 42px; margin-left: 8px; flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 5px; color: #a9aeb8; font-size: 9px; }
.swipe-actions { height: 100%; display: flex; }
.swipe-button { width: 76px; height: 100%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 13px; }
.swipe-button.delete { background: #f53f3f; }
.swipe-button.block { background: #4e5969; }
.empty-state { height: 360px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.empty-symbol { width: 58px; height: 46px; box-sizing: border-box; position: relative; border: 2px solid #c9cdd4; border-radius: 14px; }
.empty-symbol::after { content: ''; position: absolute; left: 12px; bottom: -8px; width: 13px; height: 13px; border-left: 2px solid #c9cdd4; transform: skew(-28deg); }
.empty-symbol view { position: absolute; top: 21px; width: 5px; height: 5px; border-radius: 50%; background: #c9cdd4; }
.empty-symbol view:first-child { left: 19px; }
.empty-symbol view:last-child { left: 32px; }
.empty-title { margin-top: 26px; color: #4e5969; font-size: 15px; }
.empty-desc { margin-top: 8px; color: #a9aeb8; font-size: 12px; }
</style>
