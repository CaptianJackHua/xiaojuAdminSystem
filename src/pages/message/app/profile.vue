<script setup lang="ts">
import { computed, ref } from 'vue'
import { User } from '@/message/mock'
import { currentUser, getOrCreateConversation, getUser, isMutual } from '@/message/store'

const selectedUserId = ref('u-4')
const me = computed(() => currentUser())
const teenEnabled = computed({
  get: () => me.value.teen,
  set: (value: boolean) => { me.value.teen = value }
})
const demoUsers = computed(() => ['u-4', 'u-5', 'u-6']
  .map((id) => getUser(id))
  .filter((user): user is User => !!user))
const profileUser = computed(() => getUser(selectedUserId.value) || demoUsers.value[0])
const strangerEnabled = computed({
  get: () => !!profileUser.value?.allowStranger,
  set: (value: boolean) => { if (profileUser.value) profileUser.value.allowStranger = value }
})
const mutual = computed(() => !!profileUser.value && isMutual(me.value.id, profileUser.value.id))
const hideMessageButton = computed(() => me.value.teen && !mutual.value)
const messageDisabled = computed(() => !!profileUser.value && !mutual.value
  && (profileUser.value.teen || !profileUser.value.allowStranger))
const messageButtonText = computed(() => {
  if (!profileUser.value) return '私信'
  if (profileUser.value.teen && !mutual.value) return '仅接收互关好友消息'
  if (!profileUser.value.allowStranger && !mutual.value) return '对方不接收陌生人消息'
  return '发私信'
})

function startChat() {
  if (!profileUser.value || hideMessageButton.value || messageDisabled.value) return
  const conversation = getOrCreateConversation(profileUser.value.id)
  uni.navigateTo({ url: `/pages/message/app/chat?id=${conversation.id}` })
}
</script>

<template>
  <view class="shell">
    <app-sidebar active="msg-app-profile" />
    <view class="page">
      <view class="breadcrumb">
        <text>私信管理</text><text class="sep">/</text><text>APP 演示</text><text class="sep">/</text><text class="cur">用户主页</text>
      </view>
      <view class="page-head">
        <view>
          <text class="page-title">用户主页私信</text>
          <text class="page-sub">切换陌生人设置与青少年账号，验证私信入口权限</text>
        </view>
        <view class="head-btns">
          <view
            v-for="user in demoUsers"
            :key="user.id"
            class="demo-user"
            :class="{ active: selectedUserId === user.id }"
            @click="selectedUserId = user.id"
          >{{ user.nickname }} · {{ user.id }}</view>
          <view class="teen-toggle">
            <text>对方允许陌生人私信</text>
            <wd-switch v-model="strangerEnabled" size="small" color="#165DFF" />
          </view>
          <view class="teen-toggle">
            <text>当前账号青少年</text>
            <wd-switch v-model="teenEnabled" size="small" color="#165DFF" />
          </view>
        </view>
      </view>

      <view class="demo-stage">
        <phone-demo>
          <view v-if="profileUser" class="app-screen">
            <view class="mobile-nav">
              <text>用户主页</text>
              <text class="viewer-mode">当前：{{ me.teen ? '青少年' : '常规' }}</text>
            </view>
            <scroll-view scroll-y class="profile-scroll">
              <view class="profile-hero">
                <view class="hero-circle circle-one" /><view class="hero-circle circle-two" />
                <view class="profile-avatar" :style="{ backgroundColor: profileUser.avatarColor }">{{ profileUser.nickname.charAt(0) }}</view>
                <text class="profile-name">{{ profileUser.nickname }}</text>
                <view class="profile-tags">
                  <text class="profile-tag">{{ mutual ? '互关好友' : '陌生人' }}</text>
                  <text v-if="profileUser.teen" class="profile-tag teen">青少年账号</text>
                </view>
                <text class="profile-signature">{{ profileUser.signature }}</text>
              </view>

              <view class="profile-card stats-card">
                <view class="stat-item"><text class="stat-value">{{ profileUser.followingIds.length }}</text><text class="stat-label">关注</text></view>
                <view class="stat-divider" />
                <view class="stat-item"><text class="stat-value">{{ mutual ? '已互关' : '未互关' }}</text><text class="stat-label">好友关系</text></view>
                <view class="stat-divider" />
                <view class="stat-item"><text class="stat-value">{{ profileUser.allowStranger ? '允许' : '关闭' }}</text><text class="stat-label">陌生人私信</text></view>
              </view>

              <view class="profile-card about-card">
                <text class="card-title">关于对方</text>
                <view class="info-row"><text class="info-label">用户 ID</text><text class="info-value">{{ profileUser.id }}</text></view>
                <view class="info-row"><text class="info-label">骑行签名</text><text class="info-value">{{ profileUser.signature }}</text></view>
              </view>
            </scroll-view>

            <view class="profile-footer">
              <view v-if="hideMessageButton" class="teen-privacy">青少年模式仅支持与互关好友私信</view>
              <view
                v-else
                class="private-button"
                :class="{ disabled: messageDisabled }"
                @click="startChat"
              >{{ messageButtonText }}</view>
            </view>
          </view>
        </phone-demo>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page { min-height: 100vh; padding: 24rpx 32rpx 40rpx 242rpx; box-sizing: border-box; background: #f7f8fa; }
.breadcrumb { display: flex; gap: 6rpx; color: #86909c; font-size: 24rpx; .sep { color: #c9cdd4; } .cur { color: #1d2129; } }
.page-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 24rpx; margin: 24rpx 0 20rpx; }
.page-title { display: block; color: #1d2129; font-size: 44rpx; font-weight: 700; }
.page-sub { display: block; margin-top: 10rpx; color: #86909c; font-size: 24rpx; }
.head-btns { display: flex; align-items: center; justify-content: flex-end; gap: 12rpx; flex-wrap: wrap; }
.demo-user { padding: 10rpx 18rpx; border: 2rpx solid #e5e6eb; border-radius: 24rpx; color: #4e5969; background: #fff; font-size: 22rpx; cursor: pointer; }
.demo-user.active { color: #165DFF; border-color: #165DFF; background: #eef4ff; }
.teen-toggle { display: flex; align-items: center; gap: 12rpx; color: #4e5969; font-size: 22rpx; }
.demo-stage { display: flex; justify-content: center; padding: 12rpx 0 32rpx; }

.app-screen { height: 100%; display: flex; flex-direction: column; background: #f7f8fa; color: #1d2129; }
.mobile-nav { height: 56px; flex-shrink: 0; padding: 0 18px; box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; background: #fff; border-bottom: 1px solid #f2f3f5; font-size: 17px; font-weight: 600; }
.viewer-mode { color: #86909c; font-size: 10px; font-weight: 400; }
.profile-scroll { flex: 1; min-height: 0; }
.profile-hero { height: 242px; position: relative; overflow: hidden; padding-top: 28px; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; background: linear-gradient(150deg, #eaf1ff 0%, #f7faff 58%, #fff 100%); }
.hero-circle { position: absolute; border-radius: 50%; background: rgba(22, 93, 255, 0.06); }
.circle-one { width: 180px; height: 180px; right: -70px; top: -85px; }
.circle-two { width: 110px; height: 110px; left: -48px; bottom: -36px; }
.profile-avatar { width: 76px; height: 76px; z-index: 1; display: flex; align-items: center; justify-content: center; border: 4px solid rgba(255, 255, 255, 0.85); border-radius: 50%; box-shadow: 0 6px 18px rgba(29, 33, 41, 0.12); color: #fff; font-size: 28px; font-weight: 600; }
.profile-name { z-index: 1; margin-top: 10px; font-size: 20px; font-weight: 700; }
.profile-tags { z-index: 1; height: 20px; margin-top: 6px; display: flex; gap: 6px; }
.profile-tag { padding: 1px 7px; border-radius: 9px; color: #165DFF; background: #eaf1ff; font-size: 9px; line-height: 16px; }
.profile-tag.teen { color: #b25f00; background: #fff7e8; }
.profile-signature { z-index: 1; margin-top: 9px; color: #4e5969; font-size: 12px; }
.profile-card { margin: 12px 14px 0; padding: 16px; box-sizing: border-box; border: 1px solid #f2f3f5; border-radius: 12px; background: #fff; }
.stats-card { margin-top: -14px; z-index: 2; position: relative; display: flex; align-items: center; box-shadow: 0 4px 16px rgba(29, 33, 41, 0.05); }
.stat-item { flex: 1; display: flex; flex-direction: column; align-items: center; }
.stat-value { color: #1d2129; font-size: 14px; font-weight: 600; }
.stat-label { margin-top: 5px; color: #86909c; font-size: 10px; }
.stat-divider { width: 1px; height: 28px; background: #f2f3f5; }
.about-card { margin-bottom: 16px; }
.card-title { display: block; margin-bottom: 10px; font-size: 14px; font-weight: 600; }
.info-row { padding: 9px 0; display: flex; align-items: flex-start; border-top: 1px solid #f7f8fa; font-size: 11px; line-height: 17px; }
.info-label { width: 66px; flex-shrink: 0; color: #86909c; }
.info-value { flex: 1; color: #4e5969; text-align: right; }
.profile-footer { flex-shrink: 0; padding: 12px 16px 16px; background: #fff; border-top: 1px solid #f2f3f5; }
.private-button { height: 42px; border-radius: 22px; color: #fff; background: #165DFF; box-shadow: 0 4px 12px rgba(22, 93, 255, 0.2); font-size: 14px; font-weight: 600; line-height: 42px; text-align: center; }
.private-button.disabled { color: #a9aeb8; background: #e5e6eb; box-shadow: none; font-size: 12px; }
.teen-privacy { padding: 8px 0; color: #86909c; font-size: 11px; line-height: 18px; text-align: center; }
</style>
