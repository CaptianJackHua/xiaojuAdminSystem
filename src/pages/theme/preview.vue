<!--
  预览与真机验证：
  - 静态合成预览（当前皮肤配置）
  - 双端并排预览（iOS + Android）
  - 扫码真机预览（走测试环境，不污染线上数据）
-->
<script setup lang="ts">
import { ref, computed } from 'vue'

const tabs = ['静态合成', '双端并排', '扫码真机'] as const
type Tab = typeof tabs[number]
const activeTab = ref<Tab>('静态合成')

// 选中的皮肤
const themeName = ref('夏日骑行·薄荷绿')
const themeCode = ref('summer-mint')

// 双端并排的模式切换
type Platform = 'ios' | 'android'
type Mode = 'light' | 'dark'
const leftPlatform = ref<Platform>('ios')
const leftMode = ref<Mode>('light')
const rightPlatform = ref<Platform>('android')
const rightMode = ref<Mode>('dark')

// 真机扫码
const testEnv = ref('pre-release-1')
const scanUrl = computed(() =>
  `https://api.pre.leju.com/theme/preview?code=${themeCode.value}&env=${testEnv.value}`
)

const envList = [
  { label: '预发布 1 号', value: 'pre-release-1' },
  { label: '预发布 2 号', value: 'pre-release-2' },
  { label: '集成测试', value: 'integration' }
]

function copyScanUrl() {
  uni.setClipboardData({
    data: scanUrl.value,
    success: () => uni.showToast({ title: '已复制测试链接', icon: 'success' })
  })
}

function refreshQr() {
  uni.showToast({ title: '二维码已刷新', icon: 'none' })
}
</script>

<template>
  <view class="shell">
    <app-sidebar active="theme-preview" />

    <view class="page">
      <view class="breadcrumb">
        <text>主题配置</text><text class="sep">/</text><text class="cur">预览与真机验证</text>
      </view>

      <view class="page-head">
        <view>
          <text class="page-title">预览与真机验证</text>
          <text class="page-sub">静态合成 · 双端并排 · 扫码真机（走测试环境，不污染线上数据）</text>
        </view>
        <view class="head-btns">
          <wd-button plain type="primary" size="small">切换皮肤</wd-button>
          <wd-button type="primary" size="small">生成合成图</wd-button>
        </view>
      </view>

      <!-- Tab 切换 -->
      <view class="tabs">
        <view
          v-for="t in tabs"
          :key="t"
          class="tab"
          :class="{ active: activeTab === t }"
          @click="activeTab = t"
        >{{ t }}</view>
      </view>

      <!-- Tab 1：静态合成 -->
      <view v-if="activeTab === '静态合成'" class="tab-panel">
        <view class="panel-desc">
          <wd-icon name="info" size="26rpx" color="#165DFF" />
          <text>
            静态合成预览将当前皮肤的色彩 / 图片 / 组件配置合成到标准 UI 模板上，
            用于快速验色与排版。合成图仅用于预览，不会发布到线上。
          </text>
        </view>

        <view class="compose-grid">
          <view class="compose-card">
            <view class="compose-thumb" style="background: linear-gradient(135deg, #00B42A, #7BE188);">
              <text class="compose-label">首页 Banner</text>
            </view>
            <text class="compose-name">banner-home</text>
          </view>
          <view class="compose-card">
            <view class="compose-thumb" style="background: #F0FFF4;">
              <text class="compose-label text-dark">页面背景</text>
            </view>
            <text class="compose-name">bg</text>
          </view>
          <view class="compose-card">
            <view class="compose-thumb" style="background: #00B42A;">
              <text class="compose-label">品牌主色</text>
            </view>
            <text class="compose-name">primary</text>
          </view>
          <view class="compose-card">
            <view class="compose-thumb" style="background: #7BE188;">
              <text class="compose-label">辅助色</text>
            </view>
            <text class="compose-name">secondary</text>
          </view>
          <view class="compose-card">
            <view class="compose-thumb" style="background: #1D2129;">
              <text class="compose-label">主文字</text>
            </view>
            <text class="compose-name">text</text>
          </view>
          <view class="compose-card">
            <view class="compose-thumb" style="background: #4E5969;">
              <text class="compose-label">副文字</text>
            </view>
            <text class="compose-name">text-sub</text>
          </view>
        </view>

        <view class="compose-footer">
          <text>当前皮肤：<text class="strong">{{ themeName }}（{{ themeCode }}）</text></text>
          <view class="btns-inline">
            <wd-button plain type="primary" size="small">导出 PSD</wd-button>
            <wd-button type="primary" size="small">上传到审批</wd-button>
          </view>
        </view>
      </view>

      <!-- Tab 2：双端并排 -->
      <view v-if="activeTab === '双端并排'" class="tab-panel tab-panel--side">
        <view class="side-preview">
          <view class="side-header">
            <view class="seg seg--row">
              <view
                class="seg-item"
                :class="{ active: leftPlatform === 'ios' }"
                @click="leftPlatform = 'ios'"
              >iOS</view>
              <view
                class="seg-item"
                :class="{ active: leftPlatform === 'android' }"
                @click="leftPlatform = 'android'"
              >Android</view>
            </view>
            <view class="seg seg--row">
              <view
                class="seg-item"
                :class="{ active: leftMode === 'light' }"
                @click="leftMode = 'light'"
              >明</view>
              <view
                class="seg-item"
                :class="{ active: leftMode === 'dark' }"
                @click="leftMode = 'dark'"
              >暗</view>
            </view>
          </view>
          <view class="side-body">
            <view v-if="leftPlatform === 'ios'" class="mini-phone mini-phone--ios" :class="{ dark: leftMode === 'dark' }">
              <view class="mini-notch" />
              <view class="mini-phone__status">9:41 · iOS</view>
              <view class="mini-phone__body">
                <view class="mini-card mini-card--big">
                  <text class="mini-card__label">续航</text>
                  <text class="mini-card__value">86%</text>
                </view>
                <view class="mini-row">
                  <view class="mini-card mini-card--mini"><text>32km</text><text class="mini-sub">今日</text></view>
                  <view class="mini-card mini-card--mini"><text>12%</text><text class="mini-sub">耗电</text></view>
                </view>
                <view class="mini-btn">继续骑行</view>
              </view>
            </view>
            <view v-else class="mini-phone mini-phone--android" :class="{ dark: leftMode === 'dark' }">
              <view class="mini-punch" />
              <view class="mini-phone__status">9:41 · Android</view>
              <view class="mini-phone__body">
                <view class="mini-card mini-card--big">
                  <text class="mini-card__label">续航</text>
                  <text class="mini-card__value">86%</text>
                </view>
                <view class="mini-row">
                  <view class="mini-card mini-card--mini"><text>32km</text><text class="mini-sub">今日</text></view>
                  <view class="mini-card mini-card--mini"><text>12%</text><text class="mini-sub">耗电</text></view>
                </view>
                <view class="mini-btn">继续骑行</view>
              </view>
              <view class="mini-nav-bar"><view class="nav-dot" /></view>
            </view>
          </view>
        </view>

        <view class="side-preview">
          <view class="side-header">
            <view class="seg seg--row">
              <view
                class="seg-item"
                :class="{ active: rightPlatform === 'ios' }"
                @click="rightPlatform = 'ios'"
              >iOS</view>
              <view
                class="seg-item"
                :class="{ active: rightPlatform === 'android' }"
                @click="rightPlatform = 'android'"
              >Android</view>
            </view>
            <view class="seg seg--row">
              <view
                class="seg-item"
                :class="{ active: rightMode === 'light' }"
                @click="rightMode = 'light'"
              >明</view>
              <view
                class="seg-item"
                :class="{ active: rightMode === 'dark' }"
                @click="rightMode = 'dark'"
              >暗</view>
            </view>
          </view>
          <view class="side-body">
            <view v-if="rightPlatform === 'ios'" class="mini-phone mini-phone--ios" :class="{ dark: rightMode === 'dark' }">
              <view class="mini-notch" />
              <view class="mini-phone__status">9:41 · iOS</view>
              <view class="mini-phone__body">
                <view class="mini-card mini-card--big">
                  <text class="mini-card__label">续航</text>
                  <text class="mini-card__value">86%</text>
                </view>
                <view class="mini-row">
                  <view class="mini-card mini-card--mini"><text>32km</text><text class="mini-sub">今日</text></view>
                  <view class="mini-card mini-card--mini"><text>12%</text><text class="mini-sub">耗电</text></view>
                </view>
                <view class="mini-btn">继续骑行</view>
              </view>
            </view>
            <view v-else class="mini-phone mini-phone--android" :class="{ dark: rightMode === 'dark' }">
              <view class="mini-punch" />
              <view class="mini-phone__status">9:41 · Android</view>
              <view class="mini-phone__body">
                <view class="mini-card mini-card--big">
                  <text class="mini-card__label">续航</text>
                  <text class="mini-card__value">86%</text>
                </view>
                <view class="mini-row">
                  <view class="mini-card mini-card--mini"><text>32km</text><text class="mini-sub">今日</text></view>
                  <view class="mini-card mini-card--mini"><text>12%</text><text class="mini-sub">耗电</text></view>
                </view>
                <view class="mini-btn">继续骑行</view>
              </view>
              <view class="mini-nav-bar"><view class="nav-dot" /></view>
            </view>
          </view>
        </view>
      </view>

      <!-- Tab 3：扫码真机 -->
      <view v-if="activeTab === '扫码真机'" class="tab-panel">
        <view class="qr-layout">
          <view class="qr-left">
            <view class="qr-box">
              <!-- 占位二维码（用 grid 表示） -->
              <view class="qr-code">
                <view v-for="i in 81" :key="i" class="qr-cell" :class="{ on: (i * 7) % 3 === 0 || (i * 13) % 5 === 0 }" />
              </view>
              <view class="qr-center-logo">LJ</view>
            </view>

            <view class="qr-info">
              <text class="qr-title">真机预览二维码</text>
              <text class="qr-desc">小驹 GO App 扫码即可在测试环境查看皮肤效果</text>
            </view>

            <view class="qr-url-row">
              <text class="qr-url">{{ scanUrl }}</text>
              <wd-button plain type="primary" size="mini" @click="copyScanUrl">复制</wd-button>
            </view>

            <wd-button plain size="small" @click="refreshQr">刷新二维码（30 秒有效）</wd-button>
          </view>

          <view class="qr-right">
            <view class="env-label">测试环境</view>
            <view class="env-list">
              <view
                v-for="e in envList"
                :key="e.value"
                class="env-item"
                :class="{ active: testEnv === e.value }"
                @click="testEnv = e.value"
              >
                <text>{{ e.label }}</text>
                <wd-icon v-if="testEnv === e.value" name="check" size="28rpx" color="#165DFF" />
              </view>
            </view>

            <view class="env-note">
              <view class="note-title"><wd-icon name="info" size="24rpx" color="#165DFF" /> 说明</view>
              <text class="note-text">
                · 真机预览仅走所选测试环境，不污染线上数据
                · 皮肤配置通过 API 实时下发，无需重新打包 App
                · 预览链接有效期 30 分钟，过期请刷新二维码
                · 支持多人同时扫码验证，运营与设计可同步查看
              </text>
            </view>

            <view class="env-audience">
              <text class="audience-title">当前灰度范围</text>
              <view class="audience-tags">
                <view class="tag">Android</view>
                <view class="tag">iOS</view>
                <view class="tag">v4.2+</view>
                <view class="tag">白名单 12 人</view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
$primary: #165DFF;
$primary-light: #eef4ff;
$text-main: #1d2129;
$text-2: #4e5969;
$muted: #86909c;
$muted-2: #a9aeb8;
$rule: #e5e6eb;
$bg-page: #f7f8fa;
$radius: 12rpx;

.page {
  min-height: 100vh; background: $bg-page;
  padding: 24rpx 32rpx 40rpx 242rpx; box-sizing: border-box;
}
.breadcrumb { font-size: 24rpx; color: $muted; display: flex; gap: 6rpx; align-items: center; .sep { color: $muted-2; } .cur { color: $text-main; } }
.page-head {
  display: flex; justify-content: space-between; align-items: flex-start; margin: 24rpx 0 20rpx;
  .page-title { display: block; font-size: 44rpx; font-weight: 700; color: $text-main; }
  .page-sub { display: block; font-size: 24rpx; color: $muted; margin-top: 10rpx; }
  .head-btns { display: flex; gap: 16rpx; }
}

.tabs {
  display: flex; gap: 12rpx; background: #fff; border: 2rpx solid $rule; border-radius: $radius;
  padding: 8rpx; margin-bottom: 20rpx;
}
.tab {
  flex: 1; padding: 18rpx 0; text-align: center; border-radius: 10rpx;
  font-size: 26rpx; color: $text-2;
  &.active { background: $primary; color: #fff; font-weight: 500; }
}

.tab-panel {
  background: #fff; border: 2rpx solid $rule; border-radius: $radius; padding: 24rpx;
  min-height: 800rpx;
}
.panel-desc {
  display: flex; align-items: center; gap: 10rpx; background: $primary-light;
  border-radius: 10rpx; padding: 16rpx 20rpx; font-size: 24rpx; color: $text-2; margin-bottom: 24rpx;
}

/* 静态合成 */
.compose-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 20rpx;
}
.compose-card {
  border: 2rpx solid $rule; border-radius: $radius; overflow: hidden;
  .compose-thumb {
    height: 180rpx; display: flex; align-items: flex-end; padding: 16rpx;
  }
  .compose-label { font-size: 22rpx; color: rgba(255, 255, 255, 0.9); background: rgba(0, 0, 0, 0.3); padding: 4rpx 10rpx; border-radius: 4rpx; }
  .compose-label.text-dark { color: $text-main; background: rgba(255, 255, 255, 0.9); }
  .compose-name {
    display: block; padding: 12rpx 16rpx; font-size: 22rpx; color: $muted; border-top: 2rpx solid $rule;
  }
}
.compose-footer {
  margin-top: 24rpx; padding-top: 20rpx; border-top: 2rpx solid $rule;
  display: flex; justify-content: space-between; align-items: center; font-size: 24rpx; color: $text-2;
  .strong { color: $text-main; font-weight: 500; }
}
.btns-inline { display: flex; gap: 16rpx; }

/* 双端并排 */
.tab-panel--side { display: flex; gap: 24rpx; }
.side-preview {
  flex: 1; border: 2rpx solid $rule; border-radius: $radius; padding: 16rpx;
  display: flex; flex-direction: column;
}
.side-header { display: flex; justify-content: space-between; align-items: center; padding: 8rpx 8rpx 12rpx; border-bottom: 2rpx solid $rule; margin-bottom: 16rpx; }
.seg--row { display: flex; gap: 4rpx; background: #f2f3f5; border-radius: 8rpx; padding: 4rpx; }
.seg--row .seg-item {
  padding: 8rpx 18rpx; border-radius: 6rpx; font-size: 22rpx; color: $text-2;
  &.active { background: $primary; color: #fff; font-weight: 500; }
}
.side-body { display: flex; justify-content: center; padding: 20rpx 0; }

/* 小型手机预览 */
.mini-phone {
  width: 260rpx; border: 4rpx solid #1d2129; border-radius: 36rpx; overflow: hidden;
  background: #fff;
  &.dark { background: #141414; .mini-phone__status { background: #000; color: #fff; } .mini-phone__body { background: #141414; color: #fff; } .mini-phone__body * { color: #fff; } }
}
.mini-phone__status {
  height: 32rpx; padding: 0 16rpx; font-size: 18rpx; color: #fff; background: #00B42A;
  display: flex; align-items: center;
}
.mini-phone__body { padding: 12rpx; background: #F0FFF4; min-height: 380rpx; }
.mini-card {
  border-radius: 12rpx; background: #00B42A; color: #fff; padding: 14rpx;
  &--big { min-height: 120rpx; margin-bottom: 10rpx; }
  &--mini { flex: 1; background: rgba(123, 225, 136, 0.4); color: $text-main; font-size: 26rpx; font-weight: 600; display: flex; flex-direction: column; padding: 12rpx; }
}
.mini-card__label { font-size: 18rpx; opacity: 0.8; display: block; }
.mini-card__value { font-size: 44rpx; font-weight: 700; display: block; margin-top: 4rpx; }
.mini-row { display: flex; gap: 8rpx; margin-bottom: 10rpx; }
.mini-sub { font-size: 18rpx; opacity: 0.7; font-weight: 400; }
.mini-btn {
  height: 48rpx; border-radius: 24rpx; background: #00B42A; color: #fff; font-size: 22rpx;
  display: flex; align-items: center; justify-content: center;
}

/* iOS / Android 区分样式 */
.mini-phone--ios { border-radius: 40rpx; }
.mini-notch {
  position: absolute; top: 6rpx; left: 50%; transform: translateX(-50%);
  width: 100rpx; height: 16rpx; border-radius: 8rpx; background: #000; z-index: 10;
}
.mini-punch {
  position: absolute; top: 10rpx; right: 14rpx;
  width: 18rpx; height: 18rpx; border-radius: 50%; background: #000; z-index: 10;
}
.mini-nav-bar {
  height: 12rpx; background: #1d2129; display: flex; align-items: center; justify-content: center;
}
.nav-dot { width: 24rpx; height: 4rpx; border-radius: 2rpx; background: #fff; opacity: 0.6; }

/* 扫码真机 */
.qr-layout { display: flex; gap: 40rpx; }
.qr-left {
  width: 420rpx; flex-shrink: 0;
  display: flex; flex-direction: column; align-items: center; gap: 20rpx;
}
.qr-box {
  position: relative; width: 300rpx; height: 300rpx; padding: 16rpx;
  border: 2rpx solid $rule; border-radius: $radius; background: #fff;
}
.qr-code {
  display: grid; grid-template-columns: repeat(9, 1fr); grid-template-rows: repeat(9, 1fr);
  width: 100%; height: 100%; gap: 2rpx;
}
.qr-cell {
  background: #fff;
  &.on { background: #1d2129; }
}
.qr-center-logo {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: 56rpx; height: 56rpx; background: $primary; color: #fff; font-size: 22rpx; font-weight: 700;
  border-radius: 12rpx; display: flex; align-items: center; justify-content: center;
}
.qr-info { text-align: center; }
.qr-title { display: block; font-size: 28rpx; font-weight: 500; color: $text-main; }
.qr-desc { display: block; font-size: 22rpx; color: $muted; margin-top: 6rpx; }
.qr-url-row {
  display: flex; align-items: center; gap: 12rpx; width: 100%;
  background: #f7f8fa; border-radius: 8rpx; padding: 10rpx 14rpx;
}
.qr-url { flex: 1; font-size: 20rpx; color: $text-2; word-break: break-all; }

.qr-right { flex: 1; display: flex; flex-direction: column; gap: 20rpx; }
.env-label { font-size: 24rpx; color: $muted; }
.env-list { display: flex; gap: 12rpx; flex-wrap: wrap; }
.env-item {
  padding: 14rpx 24rpx; border-radius: 8rpx; border: 2rpx solid $rule;
  font-size: 26rpx; color: $text-2; background: #fff;
  display: flex; align-items: center; gap: 8rpx;
  &.active { background: $primary-light; color: $primary; border-color: $primary; font-weight: 500; }
}

.env-note {
  background: #f7f8fa; border-radius: $radius; padding: 16rpx 20rpx;
}
.note-title { display: flex; align-items: center; gap: 6rpx; font-size: 24rpx; color: $text-2; margin-bottom: 10rpx; font-weight: 500; }
.note-text { display: block; font-size: 22rpx; color: $muted; line-height: 1.8; }

.env-audience {
  background: #fff; border: 2rpx solid $rule; border-radius: $radius; padding: 16rpx 20rpx;
}
.audience-title { display: block; font-size: 24rpx; color: $text-main; font-weight: 500; margin-bottom: 12rpx; }
.audience-tags { display: flex; gap: 10rpx; flex-wrap: wrap; }
.tag {
  padding: 6rpx 14rpx; background: #eef4ff; color: $primary; font-size: 22rpx;
  border-radius: 6rpx;
}
</style>
