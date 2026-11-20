<script setup lang="ts">
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { REPORT_TYPES, ReportType } from '@/message/mock'
import { createReport, getMessage, getUser } from '@/message/store'

const targetId = ref('u-7')
const messageId = ref('')
const conversationId = ref('')
const reportType = ref<ReportType>('骚扰广告')
const note = ref('')
const screenshots = ref<string[]>([])
const targetUser = computed(() => getUser(targetId.value))
const evidence = computed(() => getMessage(messageId.value || undefined))

onLoad((options) => {
  targetId.value = options?.targetId || 'u-7'
  messageId.value = options?.messageId || ''
  conversationId.value = options?.conversationId || ''
})

function chooseScreenshots() {
  uni.chooseImage({
    count: 3,
    sizeType: ['original', 'compressed'],
    sourceType: ['album', 'camera'],
    success: (result) => screenshots.value.push(...result.tempFilePaths)
  })
}
function previewScreenshot(current: string) {
  uni.previewImage({ urls: screenshots.value, current })
}
function removeScreenshot(index: number) {
  screenshots.value.splice(index, 1)
}
function submitReport() {
  if (!targetUser.value) {
    uni.showToast({ title: '被举报用户不存在', icon: 'none' })
    return
  }
  createReport({
    targetId: targetId.value,
    messageId: messageId.value || undefined,
    conversationId: conversationId.value || undefined,
    type: reportType.value,
    note: note.value,
    screenshots: screenshots.value
  })
  uni.showToast({ title: '举报已提交', icon: 'success' })
  setTimeout(() => uni.navigateBack({
    fail: () => uni.reLaunch({ url: '/pages/message/app/conversations' })
  }), 500)
}
</script>

<template>
  <view class="shell">
    <app-sidebar active="msg-app-report" />
    <view class="page">
      <view class="breadcrumb">
        <text>私信管理</text><text class="sep">/</text><text>APP 演示</text><text class="sep">/</text><text class="cur">举报用户</text>
      </view>
      <view class="page-head">
        <view>
          <text class="page-title">私信举报</text>
          <text class="page-sub">提交违规类型、消息证据与聊天截图</text>
        </view>
      </view>

      <view class="demo-stage">
        <phone-demo>
          <view class="app-screen">
            <view class="mobile-title">
              <text class="mobile-heading">举报</text>
              <text class="mobile-caption">请提供真实有效的信息</text>
            </view>
            <scroll-view scroll-y class="report-scroll">
              <view v-if="targetUser" class="target-card">
                <view class="target-avatar" :style="{ backgroundColor: targetUser.avatarColor }">{{ targetUser.nickname.charAt(0) }}</view>
                <view class="target-info">
                  <text class="section-label">被举报用户</text>
                  <text class="target-name">{{ targetUser.nickname }}</text>
                </view>
                <text class="target-id">{{ targetUser.id }}</text>
              </view>

              <view class="form-card evidence-card">
                <text class="card-title">消息证据</text>
                <view v-if="evidence" class="evidence-content">
                  <text class="evidence-text">{{ evidence.text }}</text>
                  <text class="evidence-time">{{ evidence.sentAt }}</text>
                </view>
                <text v-else class="no-evidence">未关联具体消息，可在备注中补充说明</text>
              </view>

              <view class="form-card">
                <text class="card-title required">举报类型</text>
                <view class="report-types">
                  <view
                    v-for="type in REPORT_TYPES"
                    :key="type"
                    class="report-type"
                    :class="{ selected: reportType === type }"
                    @click="reportType = type"
                  >
                    <view class="radio"><view v-if="reportType === type" class="radio-dot" /></view>
                    <text>{{ type }}</text>
                  </view>
                </view>
              </view>

              <view class="form-card">
                <text class="card-title">补充说明</text>
                <textarea
                  v-model="note"
                  class="note-input"
                  maxlength="200"
                  placeholder="请描述遇到的问题，便于审核人员核实"
                  placeholder-style="color:#a9aeb8"
                />
                <text class="word-count">{{ note.length }}/200</text>
              </view>

              <view class="form-card screenshot-card">
                <text class="card-title">聊天截图</text>
                <view class="screenshot-grid">
                  <view v-for="(path, index) in screenshots" :key="`${path}-${index}`" class="screenshot-item">
                    <image class="screenshot-image" :src="path" mode="aspectFill" @click="previewScreenshot(path)" />
                    <text class="delete-image" @click.stop="removeScreenshot(index)">删除</text>
                  </view>
                  <view class="upload-button" @click="chooseScreenshots">
                    <text class="upload-plus">+</text>
                    <text>上传截图</text>
                  </view>
                </view>
                <text class="upload-hint">点击已上传图片可预览，最多一次选择 3 张</text>
              </view>
            </scroll-view>
            <view class="report-footer">
              <view class="submit-button" @click="submitReport">提交举报</view>
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
.page-head { display: flex; justify-content: space-between; align-items: flex-start; margin: 24rpx 0 20rpx; }
.page-title { display: block; color: #1d2129; font-size: 44rpx; font-weight: 700; }
.page-sub { display: block; margin-top: 10rpx; color: #86909c; font-size: 24rpx; }
.demo-stage { display: flex; justify-content: center; padding: 12rpx 0 32rpx; }

.app-screen { height: 100%; display: flex; flex-direction: column; color: #1d2129; background: #f7f8fa; }
.mobile-title { height: 58px; flex-shrink: 0; padding: 0 18px; box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; background: #fff; border-bottom: 1px solid #f2f3f5; }
.mobile-heading { font-size: 20px; font-weight: 700; }
.mobile-caption { color: #a9aeb8; font-size: 10px; }
.report-scroll { flex: 1; min-height: 0; }
.target-card { margin: 12px 14px 0; padding: 14px; box-sizing: border-box; display: flex; align-items: center; border-radius: 12px; background: #fff; }
.target-avatar { width: 44px; height: 44px; flex-shrink: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 17px; font-weight: 600; }
.target-info { flex: 1; margin-left: 11px; }
.section-label { display: block; color: #86909c; font-size: 9px; }
.target-name { display: block; margin-top: 4px; font-size: 14px; font-weight: 600; }
.target-id { color: #a9aeb8; font-size: 10px; }
.form-card { margin: 10px 14px 0; padding: 14px; box-sizing: border-box; border-radius: 12px; background: #fff; }
.card-title { display: block; margin-bottom: 12px; font-size: 13px; font-weight: 600; }
.evidence-content { padding: 11px 12px; box-sizing: border-box; border-left: 3px solid #c9d8ff; border-radius: 3px 8px 8px 3px; background: #f7f8fa; }
.evidence-text { display: block; color: #4e5969; font-size: 12px; line-height: 19px; word-break: break-all; }
.evidence-time { display: block; margin-top: 7px; color: #a9aeb8; font-size: 9px; }
.no-evidence { color: #a9aeb8; font-size: 11px; }
.report-types { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; }
.report-type { height: 36px; padding: 0 10px; box-sizing: border-box; display: flex; align-items: center; border: 1px solid #e5e6eb; border-radius: 8px; color: #4e5969; font-size: 12px; }
.report-type.selected { color: #165DFF; border-color: #165DFF; background: #f2f6ff; }
.radio { width: 14px; height: 14px; margin-right: 8px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 1px solid #c9cdd4; border-radius: 50%; }
.selected .radio { border-color: #165DFF; }
.radio-dot { width: 6px; height: 6px; border-radius: 50%; background: #165DFF; }
.note-input { width: 100%; height: 86px; padding: 10px 11px; box-sizing: border-box; border-radius: 8px; color: #1d2129; background: #f7f8fa; font-size: 12px; line-height: 19px; }
.word-count { display: block; margin-top: 5px; color: #a9aeb8; font-size: 9px; text-align: right; }
.screenshot-card { margin-bottom: 14px; }
.screenshot-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 9px; }
.screenshot-item, .upload-button { height: 82px; overflow: hidden; border-radius: 8px; }
.screenshot-item { position: relative; background: #f2f3f5; }
.screenshot-image { width: 100%; height: 100%; }
.delete-image { position: absolute; left: 0; right: 0; bottom: 0; height: 22px; color: #fff; background: rgba(29, 33, 41, 0.68); font-size: 9px; line-height: 22px; text-align: center; }
.upload-button { box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 1px dashed #c9cdd4; color: #86909c; background: #fafbfc; font-size: 10px; }
.upload-plus { margin-bottom: 3px; color: #a9aeb8; font-size: 24px; font-weight: 300; line-height: 26px; }
.upload-hint { display: block; margin-top: 9px; color: #a9aeb8; font-size: 9px; }
.report-footer { flex-shrink: 0; padding: 11px 14px 15px; background: #fff; border-top: 1px solid #f2f3f5; }
.submit-button { height: 42px; border-radius: 22px; color: #fff; background: #165DFF; font-size: 14px; font-weight: 600; line-height: 42px; text-align: center; }
</style>
