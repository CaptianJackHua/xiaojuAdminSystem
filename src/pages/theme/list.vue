<!--
  主题库：列表管理全部皮肤 + 类型专属参数卡 + 新建皮肤完整表单
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  mockThemes, ThemeType, ThemeStatus, ThemePlatform,
  STATUS_LABEL, STATUS_COLOR, PLATFORM_LABEL, SkinTheme,
  TYPE_PARAMS, ThemeTypeParam, mockCarModels, mockTerminals
} from '@/theme/mock'

// ---------- 筛选 ----------
const kw = ref('')
const filterType = ref<ThemeType | ''>('')
const filterStatus = ref<ThemeStatus | ''>('')
const filterPlatform = ref<ThemePlatform | ''>('')
const filterDateFrom = ref('')
const filterDateTo = ref('')

const typeList: ThemeType[] = ['节日', '活动', '季节', '日常', '联名']
const statusList: ThemeStatus[] = ['draft', 'gray', 'online', 'offline']
const platformList: ThemePlatform[] = ['ios', 'android', 'all']

const list = computed<SkinTheme[]>(() => {
  const k = kw.value.trim().toLowerCase()
  return mockThemes.filter((t) => {
    if (k && t.name.toLowerCase().indexOf(k) === -1 && t.code.toLowerCase().indexOf(k) === -1) return false
    if (filterType.value && t.type !== filterType.value) return false
    if (filterStatus.value && t.status !== filterStatus.value) return false
    if (filterPlatform.value && !t.platforms.includes(filterPlatform.value)) return false
    if (filterDateFrom.value && t.effectiveTime < filterDateFrom.value) return false
    if (filterDateTo.value && t.effectiveTime > filterDateTo.value + ' 23:59') return false
    return true
  })
})

function statusTag(status: ThemeStatus) {
  return { text: STATUS_LABEL[status], color: STATUS_COLOR[status] }
}
function platformText(platforms: ThemePlatform[]) {
  if (platforms.length === 2) return '全平台'
  return platforms.map((p) => PLATFORM_LABEL[p]).join(' / ')
}
function resetFilter() {
  kw.value = filterType.value = filterStatus.value = filterPlatform.value = ''
  filterDateFrom.value = filterDateTo.value = ''
}

function goEditor(t: SkinTheme) { uni.navigateTo({ url: `/pages/theme/editor?id=${t.id}` }) }
function goPreview(t: SkinTheme) { uni.navigateTo({ url: `/pages/theme/preview?id=${t.id}` }) }
function goRelease(t: SkinTheme) { uni.navigateTo({ url: `/pages/theme/release?id=${t.id}` }) }

// ---------- 类型参数卡 ----------
const selectedType = ref<ThemeType>('节日')
const typeParams = ref<Record<string, string>>({})

function switchType(t: ThemeType) {
  selectedType.value = t
  typeParams.value = {}
  TYPE_PARAMS[t].forEach((p) => { if (p.default) typeParams.value[p.key] = p.default })
}
switchType('节日') // 初始化

// ---------- 详情抽屉 ----------
const showDetail = ref(false)
const detailItem = ref<SkinTheme | null>(null)
function openDetail(t: SkinTheme) { detailItem.value = t; showDetail.value = true }

// ---------- 新建皮肤 Drawer ----------
const showNew = ref(false)
function openNew() {
  form.name = ''; form.code = ''; form.type = '节日'
  form.platforms = ['ios', 'android']
  form.colorPrimary = '#E83A30'; form.colorSecondary = '#F7B500'; form.colorBg = '#FFF6EC'; form.colorText = '#1D2129'
  form.effectiveTime = ''; form.grayRatio = 5
  form.carModels = []; form.terminals = []; form.remark = ''
  form.typeParams = {}
  showNew.value = true
}

function onNewTypeChange() {
  form.typeParams = {}
  TYPE_PARAMS[form.type].forEach((p) => { if (p.default) form.typeParams[p.key] = p.default })
}

const form = ref({
  name: '', code: '', type: '节日' as ThemeType,
  platforms: ['ios'] as ThemePlatform[],
  colorPrimary: '#E83A30', colorSecondary: '#F7B500',
  colorBg: '#FFF6EC', colorText: '#1D2129',
  effectiveTime: '', grayRatio: 5,
  carModels: [] as string[], terminals: [] as string[],
  remark: '',
  typeParams: {} as Record<string, string>
})

function togglePlatform(p: ThemePlatform) {
  const i = form.value.platforms.indexOf(p)
  if (i === -1) form.value.platforms.push(p)
  else form.value.platforms.splice(i, 1)
}
function toggleCm(id: string) {
  const i = form.value.carModels.indexOf(id)
  if (i === -1) form.value.carModels.push(id)
  else form.value.carModels.splice(i, 1)
}
function toggleTm(id: string) {
  const i = form.value.terminals.indexOf(id)
  if (i === -1) form.value.terminals.push(id)
  else form.value.terminals.splice(i, 1)
}

function submitNew() {
  if (!form.value.name.trim()) return uni.showToast({ title: '请填写皮肤名称', icon: 'none' })
  if (!form.value.code.trim()) return uni.showToast({ title: '请填写皮肤编码', icon: 'none' })
  const name = form.value.name.trim()
  const code = form.value.code.trim()
  showNew.value = false
  uni.showToast({ title: `「${name}」已创建`, icon: 'success' })
  // 创建成功后直接进入皮肤编辑器继续配置
  setTimeout(() => {
    uni.navigateTo({
      url: `/pages/theme/editor?name=${encodeURIComponent(name)}&code=${encodeURIComponent(code)}`
    })
  }, 300)
}
</script>

<template>
  <view class="shell">
    <app-sidebar active="theme-list" />

    <view class="page">
      <view class="breadcrumb">
        <text>主题配置</text><text class="sep">/</text><text class="cur">主题库</text>
      </view>

      <view class="page-head">
        <view>
          <text class="page-title">主题库</text>
          <text class="page-sub">全部皮肤列表 · 运营日常入口 · 共 {{ list.length }} 项</text>
        </view>
        <view class="head-btns">
          <wd-button plain type="primary" size="small" @click="openNew">+ 新建皮肤</wd-button>
          <wd-button plain size="small" @click="resetFilter">重置筛选</wd-button>
        </view>
      </view>

      <!-- 类型参数卡 -->
      <view class="type-card">
        <view class="type-card-head">
          <text class="type-card-title">主题类型专属参数</text>
          <view class="type-switcher">
            <view
              v-for="t in typeList"
              :key="t"
              class="type-chip"
              :class="{ active: selectedType === t }"
              @click="switchType(t)"
            >{{ t }}</view>
          </view>
        </view>
        <view class="type-card-body">
          <view v-for="p in TYPE_PARAMS[selectedType]" :key="p.key" class="tp-row">
            <text class="tp-label">{{ p.label }}</text>
            <input
              v-if="p.type !== 'select'"
              v-model="typeParams[p.key]"
              class="tp-input"
              :placeholder="p.hint"
              placeholder-style="color:#c9cdd4"
            />
            <view v-else class="tp-select-list">
              <view
                v-for="o in p.options"
                :key="o"
                class="tp-chip"
                :class="{ active: typeParams[p.key] === o }"
                @click="typeParams[p.key] = typeParams[p.key] === o ? '' : o"
              >{{ o }}</view>
            </view>
            <text v-if="p.hint && p.type !== 'select'" class="tp-hint">{{ p.hint }}</text>
          </view>
        </view>
      </view>

      <!-- 筛选 -->
      <view class="filter-card">
        <view class="filter-row">
          <view class="search-box">
            <wd-icon name="search" size="28rpx" color="#a9aeb8" />
            <input v-model="kw" class="search-input" placeholder="搜索名称 / 编码" placeholder-style="color:#a9aeb8" />
          </view>
          <view class="filter-pills">
            <view class="pill" :class="{ active: !filterType }" @click="filterType = ''">全部类型</view>
            <view
              v-for="t in typeList" :key="t"
              class="pill" :class="{ active: filterType === t }"
              @click="filterType = filterType === t ? '' : t"
            >{{ t }}</view>
          </view>
        </view>
        <view class="filter-row">
          <view class="filter-label">状态</view>
          <view class="chip" :class="{ active: !filterStatus }" @click="filterStatus = ''">全部</view>
          <view
            v-for="s in statusList" :key="s"
            class="chip" :class="{ active: filterStatus === s }"
            @click="filterStatus = filterStatus === s ? '' : s"
          >{{ statusTag(s).text }}</view>

          <view class="filter-label filter-label--right">生效日期</view>
          <input v-model="filterDateFrom" class="date-input" placeholder="起始" placeholder-style="color:#c9cdd4" />
          <text class="date-sep">—</text>
          <input v-model="filterDateTo" class="date-input" placeholder="结束" placeholder-style="color:#c9cdd4" />
        </view>
      </view>

      <!-- 表格 -->
      <view class="table">
        <view class="table-head">
          <text class="col col-cover">封面</text>
          <text class="col col-name">名称 / 编码</text>
          <text class="col col-type">类型</text>
          <text class="col col-platform">适用端</text>
          <text class="col col-status">状态</text>
          <text class="col col-effect">生效时间</text>
          <text class="col col-gray">灰度比例</text>
          <text class="col col-user">使用人数</text>
          <text class="col col-op">更新 / 操作</text>
        </view>

        <block v-if="list.length">
          <view v-for="t in list" :key="t.id" class="table-row" @click="openDetail(t)">
            <view class="col col-cover">
              <view class="cover" :style="{ background: t.previewCover }">
                <text class="cover-type">{{ t.type }}</text>
              </view>
            </view>
            <view class="col col-name">
              <text class="row-name">{{ t.name }}</text>
              <text class="row-code">{{ t.code }}</text>
            </view>
            <text class="col col-type">{{ t.type }}</text>
            <text class="col col-platform">{{ platformText(t.platforms) }}</text>
            <view class="col col-status">
              <view class="status-tag" :style="{ color: statusTag(t.status).color, borderColor: statusTag(t.status).color }">
                {{ statusTag(t.status).text }}
              </view>
            </view>
            <text class="col col-effect">{{ t.effectiveTime }}</text>
            <view class="col col-gray">
              <view class="gray-bar">
                <view class="gray-fill" :style="{ width: t.grayRatio + '%', background: t.grayRatio === 100 ? '#00B42A' : '#165DFF' }" />
              </view>
              <text class="gray-text">{{ t.grayRatio }}%</text>
            </view>
            <text class="col col-user">{{ t.userCount ? t.userCount.toLocaleString() : '—' }}</text>
            <view class="col col-op" @click.stop>
              <text class="row-updated">{{ t.updatedAt }} · {{ t.updatedBy }}</text>
              <view class="op-links">
                <text class="link" @click="goEditor(t)">编辑</text>
                <text class="link" @click="goPreview(t)">预览</text>
                <text class="link" @click="goRelease(t)">发布</text>
              </view>
            </view>
          </view>
        </block>
        <view v-else class="empty-row">
          <wd-icon name="search" size="64rpx" color="#c9cdd4" />
          <text>没有匹配的皮肤</text>
        </view>
      </view>
    </view>

    <!-- 详情抽屉 -->
    <wd-popup v-model="showDetail" position="right" custom-style="{ width: '560rpx', height: '100%' }" :show-close="false">
      <view v-if="detailItem" class="drawer">
        <view class="drawer-head">
          <view>
            <text class="drawer-title">{{ detailItem.name }}</text>
            <text class="drawer-sub">{{ detailItem.code }}</text>
          </view>
          <view class="drawer-close" @click="showDetail = false">
            <wd-icon name="close" size="36rpx" color="#4e5969" />
          </view>
        </view>
        <view class="drawer-body">
          <view class="kv"><text class="k">状态</text>
            <view class="status-tag" :style="{ color: statusTag(detailItem.status).color, borderColor: statusTag(detailItem.status).color }">
              {{ statusTag(detailItem.status).text }}
            </view>
          </view>
          <view class="kv"><text class="k">类型</text><text class="v">{{ detailItem.type }}</text></view>
          <view class="kv"><text class="k">适用端</text><text class="v">{{ platformText(detailItem.platforms) }}</text></view>
          <view class="kv"><text class="k">生效时间</text><text class="v">{{ detailItem.effectiveTime }}</text></view>
          <view class="kv"><text class="k">灰度比例</text><text class="v">{{ detailItem.grayRatio }}%</text></view>
          <view class="kv"><text class="k">使用人数</text><text class="v">{{ detailItem.userCount.toLocaleString() }}</text></view>

          <view class="section-title">主题色彩</view>
          <view class="swatches">
            <view v-for="(v, k) in detailItem.colors" :key="k" class="swatch">
              <view class="swatch-block" :style="{ background: v }" />
              <view class="swatch-text">
                <text class="swatch-key">{{ k }}</text>
                <text class="swatch-val">{{ v }}</text>
              </view>
            </view>
          </view>

          <view class="section-title">发布范围</view>
          <view class="kv"><text class="k">适用车型</text>
            <text class="v">{{ detailItem.carModels.length
              ? detailItem.carModels.map(id => mockCarModels.find(c => c.id === id)?.name).filter(Boolean).join('、')
              : '全部车型' }}</text>
          </view>
          <view class="kv"><text class="k">适用终端</text>
            <text class="v">{{ detailItem.terminals.length
              ? detailItem.terminals.map(id => mockTerminals.find(t => t.id === id)?.name).filter(Boolean).join('、')
              : '全部终端' }}</text>
          </view>
        </view>
        <view class="drawer-foot">
          <wd-button plain type="primary" size="small" @click="goEditor(detailItem!)">编辑皮肤</wd-button>
          <wd-button type="primary" size="small" @click="goRelease(detailItem!)">前往发布中心</wd-button>
        </view>
      </view>
    </wd-popup>

    <!-- 新建皮肤 Drawer -->
    <wd-popup v-model="showNew" position="right" custom-style="{ width: '720rpx', height: '100%' }" :show-close="false">
      <view class="drawer">
        <view class="drawer-head">
          <text class="drawer-title">新建皮肤</text>
          <view class="drawer-close" @click="showNew = false">
            <wd-icon name="close" size="36rpx" color="#4e5969" />
          </view>
        </view>
        <scroll-view scroll-y class="drawer-body">
          <view class="form-grid">
            <view class="form-item">
              <text class="form-label">皮肤名称 *</text>
              <input v-model="form.name" class="form-input" placeholder="如：2026 春节·福运红" placeholder-style="color:#c9cdd4" />
            </view>
            <view class="form-item">
              <text class="form-label">皮肤编码 *</text>
              <input v-model="form.code" class="form-input" placeholder="如：spring-fortune-2026" placeholder-style="color:#c9cdd4" />
            </view>
          </view>

          <view class="form-item">
            <text class="form-label">主题类型</text>
            <view class="form-pills">
              <view
                v-for="t in typeList" :key="t"
                class="form-pill" :class="{ active: form.type === t }"
                @click="form.type = t; onNewTypeChange()"
              >{{ t }}</view>
            </view>
          </view>

          <view class="form-item">
            <text class="form-label">类型专属参数</text>
            <view class="tp-block">
              <view v-for="p in TYPE_PARAMS[form.type]" :key="p.key" class="tp-row tp-row--new">
                <text class="tp-label">{{ p.label }}</text>
                <input
                  v-if="p.type !== 'select'"
                  v-model="form.typeParams[p.key]"
                  class="tp-input"
                  :placeholder="p.hint"
                  placeholder-style="color:#c9cdd4"
                />
                <view v-else class="tp-select-list">
                  <view
                    v-for="o in p.options" :key="o"
                    class="tp-chip" :class="{ active: form.typeParams[p.key] === o }"
                    @click="form.typeParams[p.key] = form.typeParams[p.key] === o ? '' : o"
                  >{{ o }}</view>
                </view>
              </view>
            </view>
          </view>

          <view class="form-item">
            <text class="form-label">适用端</text>
            <view class="form-pills">
              <view
                v-for="p in ['ios', 'android'] as ThemePlatform[]" :key="p"
                class="form-pill" :class="{ active: form.platforms.includes(p) }"
                @click="togglePlatform(p)"
              >{{ PLATFORM_LABEL[p] }}</view>
            </view>
          </view>

          <view class="form-item">
            <text class="form-label">主题主色</text>
            <view class="color-row">
              <view class="color-swatch" :style="{ background: form.colorPrimary }" />
              <input v-model="form.colorPrimary" class="form-input form-input--sm" type="text" />
              <text class="color-label">辅助色</text>
              <view class="color-swatch" :style="{ background: form.colorSecondary }" />
              <input v-model="form.colorSecondary" class="form-input form-input--sm" type="text" />
            </view>
          </view>

          <view class="form-item">
            <text class="form-label">发布范围 - 车型</text>
            <view class="form-pills form-pills--multi">
              <view
                v-for="m in mockCarModels" :key="m.id"
                class="form-pill form-pill--multi"
                :class="{ active: form.carModels.includes(m.id) }"
                @click="toggleCm(m.id)"
              >{{ m.name }}<text class="pill-sub">{{ m.year }} · {{ m.tags.join('/') }}</text></view>
            </view>
          </view>

          <view class="form-item">
            <text class="form-label">发布范围 - 终端</text>
            <view class="form-pills">
              <view
                v-for="t in mockTerminals" :key="t.id"
                class="form-pill"
                :class="{ active: form.terminals.includes(t.id) }"
                @click="toggleTm(t.id)"
              >{{ t.name }}</view>
            </view>
          </view>

          <view class="form-grid">
            <view class="form-item">
              <text class="form-label">生效时间</text>
              <input v-model="form.effectiveTime" class="form-input" placeholder="YYYY-MM-DD HH:mm" placeholder-style="color:#c9cdd4" />
            </view>
            <view class="form-item">
              <text class="form-label">初始灰度 %</text>
              <input v-model.number="form.grayRatio" class="form-input" type="text" />
            </view>
          </view>

          <view class="form-item">
            <text class="form-label">备注</text>
            <input v-model="form.remark" class="form-input" placeholder="（可选）设计 / 运营备注" placeholder-style="color:#c9cdd4" />
          </view>
        </scroll-view>
        <view class="drawer-foot">
          <wd-button plain size="small" @click="showNew = false">取消</wd-button>
          <wd-button type="primary" size="small" @click="submitNew">创建皮肤</wd-button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<style lang="scss" scoped>
$primary: #165DFF; $primary-light: #eef4ff;
$text-main: #1d2129; $text-2: #4e5969;
$muted: #86909c; $muted-2: #a9aeb8;
$rule: #e5e6eb; $bg-page: #f7f8fa;

.page { min-height: 100vh; background: $bg-page; padding: 24rpx 32rpx 40rpx 242rpx; box-sizing: border-box; }
.breadcrumb { font-size: 24rpx; color: $muted; display: flex; gap: 6rpx; .sep { color: $muted-2; } .cur { color: $text-main; } }
.page-head {
  display: flex; justify-content: space-between; align-items: flex-start; margin: 24rpx 0 20rpx;
  .page-title { display: block; font-size: 44rpx; font-weight: 700; color: $text-main; }
  .page-sub { display: block; font-size: 24rpx; color: $muted; margin-top: 10rpx; }
  .head-btns { display: flex; gap: 16rpx; }
}

.type-card {
  background: #fff; border: 2rpx solid $rule; border-radius: 12rpx; padding: 20rpx 24rpx; margin-bottom: 20rpx;
}
.type-card-head {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; padding-bottom: 12rpx; border-bottom: 2rpx solid $rule;
}
.type-card-title { font-size: 26rpx; font-weight: 600; color: $text-main; }
.type-switcher { display: flex; gap: 10rpx; }
.type-chip {
  padding: 8rpx 18rpx; border-radius: 20rpx; font-size: 22rpx; color: $text-2; background: #f7f8fa;
  &.active { background: $primary-light; color: $primary; font-weight: 500; }
}
.type-card-body { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12rpx 24rpx; }
.tp-row { display: flex; flex-direction: column; gap: 6rpx; }
.tp-row--new { padding-bottom: 10rpx; border-bottom: 2rpx solid #f2f3f5; }
.tp-label { font-size: 22rpx; color: $text-2; font-weight: 500; }
.tp-input {
  height: 56rpx; border: 2rpx solid $rule; border-radius: 8rpx; padding: 0 12rpx;
  font-size: 24rpx; color: $text-main; background: #fff;
}
.tp-select-list { display: flex; gap: 8rpx; flex-wrap: wrap; }
.tp-chip {
  padding: 6rpx 14rpx; border-radius: 6rpx; font-size: 22rpx; color: $text-2; background: #f7f8fa;
  border: 2rpx solid transparent;
  &.active { background: $primary-light; color: $primary; border-color: $primary; font-weight: 500; }
}
.tp-hint { font-size: 20rpx; color: $muted-2; }

.filter-card { background: #fff; border: 2rpx solid $rule; border-radius: 12rpx; padding: 20rpx 24rpx; margin-bottom: 20rpx; }
.filter-row { display: flex; align-items: center; gap: 16rpx; flex-wrap: wrap; margin-bottom: 12rpx; &:last-child { margin-bottom: 0; } }
.search-box { display: flex; align-items: center; gap: 12rpx; height: 64rpx; padding: 0 16rpx; border: 2rpx solid $rule; border-radius: 10rpx; width: 420rpx;
  .search-input { flex: 1; font-size: 26rpx; color: $text-main; height: 100%; } }
.filter-pills { display: flex; gap: 12rpx; flex-wrap: wrap; }
.pill { padding: 8rpx 20rpx; border-radius: 30rpx; font-size: 24rpx; color: $text-2; background: #f7f8fa;
  &.active { background: $primary-light; color: $primary; font-weight: 500; } }
.filter-label { font-size: 24rpx; color: $muted; }
.filter-label--right { margin-left: 20rpx; }
.chip { padding: 6rpx 14rpx; border-radius: 6rpx; font-size: 22rpx; color: $text-2; background: #f7f8fa;
  &.active { background: $primary-light; color: $primary; font-weight: 500; } }
.date-input { width: 180rpx; height: 52rpx; border: 2rpx solid $rule; border-radius: 8rpx; padding: 0 12rpx; font-size: 22rpx; color: $text-main; }
.date-sep { color: $muted; font-size: 22rpx; }

.table { background: #fff; border: 2rpx solid $rule; border-radius: 12rpx; font-size: 24rpx; }
.table-head, .table-row { display: flex; align-items: center; padding: 20rpx 16rpx; border-bottom: 2rpx solid $rule; }
.table-head { background: #fafbfc; font-size: 22rpx; font-weight: 500; color: $text-2; }
.table-row { &:active { background: #f7faff; } }
.col { flex-shrink: 0; padding: 0 8rpx; box-sizing: border-box; }
.col-cover { width: 90rpx; }
.col-name { flex: 2; min-width: 0; }
.col-type { width: 80rpx; }
.col-platform { width: 110rpx; }
.col-status { width: 110rpx; }
.col-effect { width: 200rpx; }
.col-gray { width: 180rpx; }
.col-user { width: 120rpx; }
.col-op { flex: 1.5; min-width: 0; }
.cover { width: 64rpx; height: 64rpx; border-radius: 10rpx; display: flex; align-items: flex-end; padding: 4rpx; }
.cover-type { font-size: 18rpx; color: #fff; background: rgba(0,0,0,0.3); padding: 2rpx 8rpx; border-radius: 4rpx; }
.row-name { display: block; color: $text-main; font-weight: 500; font-size: 26rpx; }
.row-code { display: block; color: $muted-2; font-size: 20rpx; margin-top: 2rpx; }
.status-tag { display: inline-block; padding: 2rpx 14rpx; border-radius: 20rpx; font-size: 20rpx; border: 2rpx solid currentColor; }
.gray-bar { width: 100rpx; height: 10rpx; border-radius: 5rpx; background: #f2f3f5; display: inline-block; vertical-align: middle; }
.gray-fill { height: 100%; border-radius: 5rpx; }
.gray-text { margin-left: 8rpx; font-size: 22rpx; color: $text-2; }
.row-updated { display: block; color: $muted-2; font-size: 20rpx; }
.op-links { margin-top: 4rpx; display: flex; gap: 20rpx; }
.link { color: $primary; font-size: 24rpx; }
.empty-row { padding: 60rpx 0; text-align: center; color: $muted; display: flex; flex-direction: column; gap: 16rpx; align-items: center; }

/* Drawer 通用 */
.drawer { height: 100%; display: flex; flex-direction: column; background: #fff; }
.drawer-head { padding: 28rpx 32rpx; display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2rpx solid $rule; }
.drawer-title { font-size: 30rpx; font-weight: 600; color: $text-main; }
.drawer-sub { font-size: 22rpx; color: $muted; margin-top: 4rpx; display: block; }
.drawer-close { width: 56rpx; height: 56rpx; display: flex; align-items: center; justify-content: center; border-radius: 10rpx; &:active { background: #f2f3f5; } }
.drawer-body { flex: 1; overflow-y: auto; padding: 20rpx 32rpx; }
.drawer-foot { padding: 16rpx 32rpx 28rpx; border-top: 2rpx solid $rule; display: flex; gap: 12rpx; justify-content: flex-end; }
.kv { display: flex; align-items: center; padding: 12rpx 0; border-bottom: 2rpx solid #f2f3f5; font-size: 24rpx; }
.k { width: 140rpx; color: $muted; flex-shrink: 0; }
.v { color: $text-main; flex: 1; }
.section-title { margin-top: 20rpx; font-size: 24rpx; font-weight: 600; color: $text-main; }
.swatches { display: flex; flex-direction: column; gap: 8rpx; margin-top: 10rpx; }
.swatch { display: flex; align-items: center; gap: 12rpx; }
.swatch-block { width: 40rpx; height: 40rpx; border-radius: 6rpx; border: 2rpx solid #f2f3f5; }
.swatch-key { font-size: 22rpx; color: $text-main; }
.swatch-val { font-size: 20rpx; color: $muted; margin-left: 6rpx; }

/* 表单 */
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12rpx; }
.form-item { margin-bottom: 20rpx; }
.form-label { font-size: 22rpx; color: $text-2; font-weight: 500; margin-bottom: 8rpx; display: block; }
.form-input {
  width: 100%; height: 60rpx; border: 2rpx solid $rule; border-radius: 8rpx;
  padding: 0 12rpx; font-size: 24rpx; color: $text-main; background: #fff; box-sizing: border-box;
  &--sm { width: 160rpx; }
}
.form-pills { display: flex; gap: 8rpx; flex-wrap: wrap; }
.form-pill {
  padding: 10rpx 20rpx; border-radius: 20rpx; font-size: 22rpx; color: $text-2; background: #f7f8fa;
  border: 2rpx solid transparent;
  &.active { background: $primary-light; color: $primary; border-color: $primary; font-weight: 500; }
}
.form-pill--multi {
  display: flex; flex-direction: column; padding: 10rpx 16rpx; min-width: 180rpx; border-radius: 10rpx;
  .pill-sub { font-size: 18rpx; color: $muted; margin-top: 4rpx; }
}
.tp-block { background: #fafbfc; border-radius: 10rpx; padding: 8rpx 16rpx; }
.color-row { display: flex; align-items: center; gap: 10rpx; }
.color-swatch { width: 40rpx; height: 40rpx; border-radius: 6rpx; border: 2rpx solid #f2f3f5; flex-shrink: 0; }
.color-label { font-size: 22rpx; color: $muted; margin-left: 8rpx; }
</style>
