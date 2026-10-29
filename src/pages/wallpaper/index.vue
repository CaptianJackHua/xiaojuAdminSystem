<!--
  自定义壁纸/音效管理
  列表 + 新增/编辑弹窗（基本信息 / 主题配置 / 音效设置）
-->
<script setup lang="ts">
import { ref, computed } from 'vue'

// ==================== 类型 ====================
interface WallpaperItem {
  code: string
  preview: string
  url: string
}
interface ThemeItem {
  name: string
  themeImage: string
  styleImage: string
  wallpapers: WallpaperItem[]
}
interface SoundItem {
  id: string
  code: string
  name: string
  url: string
}
// 仪表功能项（可在仪表上直接控制的功能）
interface MeterFunc {
  key: string
  name: string
  code: string
  value: string
  enabled: boolean
}
// 仪表完整配置表单
interface MeterForm {
  // 1. 基本信息
  vendor: string
  productModel: string
  carModels: string[]
  width: number | ''
  height: number | ''
  status: string
  // 2A. 功能配置参数（固件信息）
  meterVersion: string
  tboxModem: string
  tboxBle: string
  // 2B. 功能清单开关
  funcs: MeterFunc[]
  // 3A. 主题壁纸音效参数（版本要求）
  themeMeterVer: string
  themeModemVer: string
  themeBleVer: string
  // 3B. 预置内容
  maxWallpapers: number | ''
  maxSounds: number | ''
  themes: ThemeItem[]
  sounds: SoundItem[]
}
interface MeterRow {
  id: number
  vendor: string
  productModel: string
  carModel: string
  meterVersion: string
  size: string
  theme: string
  wallpaperCount: number
  soundCount: number
  maxSound: number
  funcCount: number
  status: '启用' | '停用'
  detail?: MeterForm
}

// ==================== 字典 ====================
const vendorList = ['移远', '广和通', '芯讯通']
const modelMap: Record<string, string[]> = {
  移远: ['5寸TFT屏', '7寸IPS屏', '10寸IPS屏'],
  广和通: ['4.3寸TFT屏', '6.5寸IPS屏'],
  芯讯通: ['5寸IPS屏', '8寸IPS屏']
}
const carModelList = ['极光A15s测试版', '极光A16', '极光A17', '极光A18 Pro']
const statusList = ['启用', '停用']

// 仪表可选功能项（功能配置清单开关）
const funcCatalog = [
  'NFC控车',
  '密码控车',
  '报警触发灵敏度设置',
  '报警触发音量设置',
  '锁车后移动报警',
  'SOS紧急呼救',
  '延迟关闭大灯',
  '背光灯设置',
  '全部声音音量控制',
  '声音播放设备设置',
  '时钟制式设置',
  '感应提醒',
  '自动关机设置',
  '自动锁车设置',
  '能量回收',
  '休眠模式',
  '电子刹车',
  '低电量延长续航',
  '智能补电',
  '定速巡航',
  '侧撑感应',
  '坐垫感应',
  'TCS牵引力控制',
  'HDC陡坡缓降设置',
  'ARB防溜坡设置',
  '低电量消息提醒'
]

function blankFuncs(enabled: string[] = []): MeterFunc[] {
  return funcCatalog.map((name) => ({ key: name, name, code: '', value: '', enabled: enabled.includes(name) }))
}

// ==================== 列表状态 ====================
const filters = ref({
  vendor: '',
  productModel: '',
  carModel: '',
  status: ''
})
const page = ref(1)
const pageSize = ref(10)

const rows = ref<MeterRow[]>([
  {
    id: 1,
    vendor: '移远',
    productModel: '5寸TFT屏',
    carModel: '极光A15s测试版',
    meterVersion: '1.1.4.0',
    size: '800*480',
    theme: '经典',
    wallpaperCount: 1,
    soundCount: 1,
    maxSound: 10,
    funcCount: 3,
    status: '启用',
    detail: {
      vendor: '移远',
      productModel: '5寸TFT屏',
      carModels: ['极光A15s测试版'],
      width: 800,
      height: 480,
      status: '启用',
      meterVersion: '1.1.4.0',
      tboxModem: 'BG95-M3',
      tboxBle: '5.2',
      funcs: blankFuncs(['NFC控车', 'TCS牵引力控制', '定速巡航']),
      themeMeterVer: '1.1.4.0',
      themeModemVer: 'BG95-M3',
      themeBleVer: '5.2',
      maxWallpapers: 20,
      maxSounds: 10,
      themes: [
        {
          name: '经典',
          themeImage: 'https://cdn.xiaoju.com/theme/t1-themeImage.png',
          styleImage: 'https://cdn.xiaoju.com/theme/t1-styleImage.png',
          wallpapers: [
            {
              code: '0x01',
              preview: 'https://cdn.xiaoju.com/wallpaper/w1-thumb.png',
              url: 'https://cdn.xiaoju.com/wallpaper/w1.png'
            }
          ]
        }
      ],
      sounds: [{ id: '内置ID1', code: '0x3E', name: '经典', url: 'https://cdn.xiaoju.com/sound/s1.mp3' }]
    }
  }
])

const total = computed(() => rows.value.length)
const pagedRows = computed(() =>
  rows.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value)
)

function onQuery() {
  page.value = 1
  uni.showToast({ title: '查询完成', icon: 'none' })
}

function onReset() {
  filters.value = { vendor: '', productModel: '', carModel: '', status: '' }
  page.value = 1
}

// ==================== 弹窗状态 ====================
const dialogVisible = ref(false)
const dialogMode = ref<'add' | 'edit'>('add')

function blankTheme(): ThemeItem {
  return { name: '', themeImage: '', styleImage: '', wallpapers: [] }
}
function blankSound(idx: number): SoundItem {
  return { id: `内置ID${idx}`, code: '', name: '', url: '' }
}

function blankForm(): MeterForm {
  return {
    vendor: '',
    productModel: '',
    carModels: [],
    width: '',
    height: '',
    status: '启用',
    meterVersion: '',
    tboxModem: '',
    tboxBle: '',
    funcs: blankFuncs(),
    themeMeterVer: '',
    themeModemVer: '',
    themeBleVer: '',
    maxWallpapers: '',
    maxSounds: '',
    themes: [blankTheme()],
    sounds: [blankSound(1)]
  }
}

const form = ref<MeterForm>(blankForm())
const editingRow = ref<MeterRow | null>(null)
const activeTab = ref<'basic' | 'func' | 'content'>('basic')

// 新增功能弹框
const funcDialogVisible = ref(false)
const funcDraft = ref({ name: '', code: '', value: '' })

function openFuncDialog() {
  funcDraft.value = { name: '', code: '', value: '' }
  funcDialogVisible.value = true
}

function confirmFunc() {
  const name = funcDraft.value.name.trim()
  const code = funcDraft.value.code.trim()
  if (!name) return uni.showToast({ title: '请输入功能名称', icon: 'none' })
  if (!code) return uni.showToast({ title: '请输入指令代码', icon: 'none' })
  if (form.value.funcs.some((f) => f.name === name)) {
    return uni.showToast({ title: '该功能已存在', icon: 'none' })
  }
  form.value.funcs.push({
    key: `${name}-${Date.now()}`,
    name,
    code,
    value: funcDraft.value.value.trim(),
    enabled: true
  })
  funcDialogVisible.value = false
  uni.showToast({ title: '添加成功', icon: 'success' })
}

const productModels = computed(() => (form.value.vendor ? modelMap[form.value.vendor] ?? [] : []))

const enabledFuncCount = computed(() => form.value.funcs.filter((f) => f.enabled).length)

function openAdd() {
  dialogMode.value = 'add'
  editingRow.value = null
  form.value = blankForm()
  activeTab.value = 'basic'
  dialogVisible.value = true
}

// 编辑：与新增使用完全相同的表单结构，仅回填数据
function openEdit(row: MeterRow) {
  dialogMode.value = 'edit'
  editingRow.value = row
  form.value = row.detail ? JSON.parse(JSON.stringify(row.detail)) : formFromRow(row)
  activeTab.value = 'basic'
  dialogVisible.value = true
}

// 兜底：老数据没有 detail 时按扁平字段构造
function formFromRow(row: MeterRow): MeterForm {
  const [w, h] = row.size.split('*')
  return {
    vendor: row.vendor,
    productModel: row.productModel,
    carModels: row.carModel.split('、').filter(Boolean),
    width: w ? Number(w) : '',
    height: h ? Number(h) : '',
    status: row.status,
    meterVersion: row.meterVersion,
    tboxModem: '',
    tboxBle: '',
    funcs: blankFuncs(),
    themeMeterVer: '',
    themeModemVer: '',
    themeBleVer: '',
    maxWallpapers: 20,
    maxSounds: row.maxSound,
    themes: [{ name: row.theme, themeImage: '', styleImage: '', wallpapers: [] }],
    sounds: [blankSound(1)]
  }
}

function closeDialog() {
  dialogVisible.value = false
}

function onVendorChange(e: any) {
  form.value.vendor = vendorList[Number(e.detail.value)]
  form.value.productModel = ''
}

function onModelChange(e: any) {
  form.value.productModel = productModels.value[Number(e.detail.value)]
}

function onCarModelChange(e: any) {
  form.value.carModels = e.detail.value.map((i: number) => carModelList[i])
}

function onStatusChange(e: any) {
  form.value.status = statusList[Number(e.detail.value)]
}

// ==================== 主题 / 壁纸 / 音效 ====================
function addTheme() {
  form.value.themes.push(blankTheme())
}

function removeTheme(idx: number) {
  form.value.themes.splice(idx, 1)
}

function addWallpaper(ti: number) {
  const list = form.value.themes[ti].wallpapers
  list.push({ code: '', preview: '', url: '' })
}

function removeWallpaper(ti: number, wi: number) {
  form.value.themes[ti].wallpapers.splice(wi, 1)
}

function uploadThemeImage(ti: number, field: 'themeImage' | 'styleImage') {
  form.value.themes[ti][field] = `https://cdn.xiaoju.com/theme/t${ti + 1}-${field}.png`
  uni.showToast({ title: '上传成功', icon: 'none' })
}

function uploadWallpaper(ti: number, wi: number) {
  form.value.themes[ti].wallpapers[wi].url = `https://cdn.xiaoju.com/wallpaper/w${wi + 1}.png`
  form.value.themes[ti].wallpapers[wi].preview = `https://cdn.xiaoju.com/wallpaper/w${wi + 1}-thumb.png`
  uni.showToast({ title: '上传成功', icon: 'none' })
}

function addSound() {
  form.value.sounds.push(blankSound(form.value.sounds.length + 1))
}

function removeSound(idx: number) {
  form.value.sounds.splice(idx, 1)
}

function uploadSound(idx: number) {
  form.value.sounds[idx].url = `https://cdn.xiaoju.com/sound/s${idx + 1}.mp3`
  uni.showToast({ title: '上传成功', icon: 'none' })
}

function playSound(item: SoundItem) {
  uni.showToast({ title: item.url ? '试听中…' : '请先上传音频', icon: 'none' })
}

// ==================== 提交 ====================
function confirmForm() {
  if (!form.value.vendor) return uni.showToast({ title: '请选择厂商', icon: 'none' })
  if (!form.value.productModel) return uni.showToast({ title: '请选择产品型号', icon: 'none' })
  if (!form.value.carModels.length) return uni.showToast({ title: '请选择车型', icon: 'none' })
  if (!form.value.meterVersion) return uni.showToast({ title: '请输入仪表软件版本', icon: 'none' })
  if (!form.value.width || !form.value.height) return uni.showToast({ title: '请输入仪表尺寸', icon: 'none' })

  const size = `${form.value.width}*${form.value.height}`
  const themeName = form.value.themes[0]?.name || '--'
  const maxSound = Number(form.value.maxSounds) || 0
  const funcCount = enabledFuncCount.value
  // 已设置的预置内容统计
  const wallpaperCount = form.value.themes.reduce((sum, t) => sum + t.wallpapers.length, 0)
  const soundCount = form.value.sounds.filter((s) => s.code || s.name || s.url).length

  if (dialogMode.value === 'add') {
    rows.value.push({
      id: Date.now(),
      vendor: form.value.vendor,
      productModel: form.value.productModel,
      carModel: form.value.carModels.join('、'),
      meterVersion: form.value.meterVersion,
      size,
      theme: themeName,
      wallpaperCount,
      soundCount,
      maxSound,
      funcCount,
      status: form.value.status as '启用' | '停用',
      detail: JSON.parse(JSON.stringify(form.value))
    })
  } else {
    const row = editingRow.value
    if (row) {
      row.vendor = form.value.vendor
      row.productModel = form.value.productModel
      row.carModel = form.value.carModels.join('、')
      row.meterVersion = form.value.meterVersion
      row.size = size
      row.theme = themeName
      row.wallpaperCount = wallpaperCount
      row.soundCount = soundCount
      row.maxSound = maxSound
      row.funcCount = funcCount
      row.status = form.value.status as '启用' | '停用'
      row.detail = JSON.parse(JSON.stringify(form.value))
    }
  }

  dialogVisible.value = false
  uni.showToast({ title: dialogMode.value === 'add' ? '新增成功' : '保存成功', icon: 'success' })
}

function onDelete(row: MeterRow) {
  uni.showModal({
    title: '提示',
    content: `确认删除「${row.vendor} ${row.productModel}」吗？`,
    success: (res) => {
      if (res.confirm) {
        rows.value = rows.value.filter((r) => r.id !== row.id)
        uni.showToast({ title: '已删除', icon: 'none' })
      }
    }
  })
}

function onView(row: MeterRow) {
  uni.showToast({ title: `查看：${row.vendor} ${row.productModel}`, icon: 'none' })
}
</script>

<template>
  <view class="shell">
    <app-sidebar active="meter" />

    <view class="page">
      <!-- 面包屑 -->
      <view class="breadcrumb">
        <text class="cur">仪表功能配置</text>
      </view>

    <!-- 筛选栏 -->
    <view class="filter-bar">
      <picker :range="vendorList" @change="(e: any) => (filters.vendor = vendorList[Number(e.detail.value)])">
        <view class="select" :class="{ 'select--empty': !filters.vendor }">
          {{ filters.vendor || '请选择厂商' }}
        </view>
      </picker>

      <picker
        :range="filters.vendor ? modelMap[filters.vendor] ?? [] : []"
        @change="(e: any) => (filters.productModel = (modelMap[filters.vendor] ?? [])[Number(e.detail.value)])"
      >
        <view class="select" :class="{ 'select--empty': !filters.productModel }">
          {{ filters.productModel || '产品型号（先选...）' }}
        </view>
      </picker>

      <picker :range="carModelList" @change="(e: any) => (filters.carModel = carModelList[Number(e.detail.value)])">
        <view class="select" :class="{ 'select--empty': !filters.carModel }">
          {{ filters.carModel || '请选择车型' }}
        </view>
      </picker>

      <picker :range="statusList" @change="(e: any) => (filters.status = statusList[Number(e.detail.value)])">
        <view class="select" :class="{ 'select--empty': !filters.status }">
          {{ filters.status || '请选择状态' }}
        </view>
      </picker>

      <view class="filter-btns">
        <wd-button type="primary" size="small" @click="onQuery">查询</wd-button>
        <wd-button plain type="primary" size="small" @click="onReset">重置</wd-button>
      </view>
    </view>

    <!-- 操作区 -->
    <view class="toolbar">
      <wd-button type="primary" size="small" @click="openAdd">新增</wd-button>
    </view>

    <!-- 列表 -->
    <view class="table">
      <view class="table-head">
        <text class="col col-idx">序号</text>
        <text class="col col-vendor">厂商</text>
        <text class="col col-model">型号</text>
        <text class="col col-car">车型</text>
        <text class="col col-fw">仪表版本</text>
        <text class="col col-size">尺寸</text>
        <text class="col col-theme">主题</text>
        <text class="col col-sound">最大添加音效</text>
        <text class="col col-func">仪表功能项</text>
        <text class="col col-status">状态</text>
        <text class="col col-op">操作</text>
      </view>

      <view v-for="(row, i) in pagedRows" :key="row.id" class="table-row">
        <text class="col col-idx">{{ (page - 1) * pageSize + i + 1 }}</text>
        <text class="col col-vendor">{{ row.vendor }}</text>
        <text class="col col-model">{{ row.productModel }}</text>
        <text class="col col-car">{{ row.carModel }}</text>
        <text class="col col-fw">{{ row.meterVersion }}</text>
        <text class="col col-size">{{ row.size }}</text>
        <view class="col col-theme">
          <text class="theme-name">{{ row.theme }}</text>
          <text class="theme-sub">壁纸 {{ row.wallpaperCount }} · 音效 {{ row.soundCount }}</text>
        </view>
        <text class="col col-sound">{{ row.maxSound }}</text>
        <text class="col col-func">
          <text class="tag tag--func">{{ row.funcCount }} 项可控</text>
        </text>
        <text class="col col-status">
          <text class="tag" :class="row.status === '启用' ? 'tag--on' : 'tag--off'">{{ row.status }}</text>
        </text>
        <view class="col col-op">
          <text class="link-btn danger" @click="onDelete(row)">删除</text>
          <text class="link-btn" @click="openEdit(row)">编辑</text>
          <text class="link-btn" @click="onView(row)">查看</text>
        </view>
      </view>

      <view v-if="!pagedRows.length" class="empty-row">
        <text>暂无数据</text>
      </view>
    </view>

    <!-- 分页 -->
    <view class="pager">
      <text class="pager-total">共 {{ total }} 条记录</text>
      <view class="pager-ctrl">
        <text class="pager-btn" :class="{ 'pager-btn--disabled': page === 1 }" @click="page > 1 && page--">‹</text>
        <text class="pager-num">{{ page }}</text>
        <text
          class="pager-btn"
          :class="{ 'pager-btn--disabled': page * pageSize >= total }"
          @click="page * pageSize < total && page++"
        >›</text>
        <picker :range="['10/页', '20/页', '50/页']" @change="(e: any) => (pageSize = [10, 20, 50][Number(e.detail.value)])">
          <view class="page-size">{{ pageSize }}/页</view>
        </picker>
      </view>
    </view>

    <!-- ==================== 新增/编辑弹窗 ==================== -->
    <view v-if="dialogVisible" class="overlay" @click="closeDialog">
      <view class="dialog" @click.stop>
        <view class="dialog-head">
          <text class="dialog-title">{{ dialogMode === 'add' ? '新增仪表' : '编辑仪表' }}</text>
          <text class="dialog-close" @click="closeDialog">✕</text>
        </view>

        <!-- Tab 页签 -->
        <view class="tabs">
          <view class="tab" :class="{ 'tab--active': activeTab === 'basic' }" @click="activeTab = 'basic'">
            基本信息
          </view>
          <view class="tab" :class="{ 'tab--active': activeTab === 'func' }" @click="activeTab = 'func'">
            功能配置
            <text v-if="enabledFuncCount" class="tab-badge">{{ enabledFuncCount }}</text>
          </view>
          <view class="tab" :class="{ 'tab--active': activeTab === 'content' }" @click="activeTab = 'content'">
            主题壁纸音效设置
          </view>
        </view>

        <view class="dialog-body">
          <!-- 1. 基本信息 -->
          <view v-show="activeTab === 'basic'">
            <view class="section">
              <view class="section-head">
                <view class="section-title">
                  <view class="bar" />
                  <text>基本信息</text>
                </view>
                <text class="section-hint">仪表的硬件参数</text>
              </view>

              <view class="grid">
                <view class="field">
                  <text class="label required">厂商</text>
                  <picker :range="vendorList" @change="onVendorChange">
                    <view class="select" :class="{ 'select--empty': !form.vendor }">
                      {{ form.vendor || '请选择厂商' }}
                    </view>
                  </picker>
                </view>

                <view class="field">
                  <text class="label required">产品型号</text>
                  <picker :range="productModels" @change="onModelChange">
                    <view class="select" :class="{ 'select--empty': !form.productModel }">
                      {{ form.productModel || '先选厂商' }}
                    </view>
                  </picker>
                </view>

                <view class="field">
                  <text class="label required">车型</text>
                  <picker mode="multiSelector" :range="[carModelList]" @change="onCarModelChange">
                    <view class="select" :class="{ 'select--empty': !form.carModels.length }">
                      {{ form.carModels.length ? form.carModels.join('、') : '选择车型（支持多选）' }}
                    </view>
                  </picker>
                </view>

                <view class="field">
                  <text class="label required">状态</text>
                  <picker :range="statusList" @change="onStatusChange">
                    <view class="select">{{ form.status }}</view>
                  </picker>
                </view>

                <view class="field">
                  <text class="label required">仪表尺寸</text>
                  <view class="size-row">
                    <view class="size-box">
                      <text class="size-tag">宽</text>
                      <input v-model="form.width" class="size-input" type="number" placeholder="宽" />
                      <text class="size-unit">px</text>
                    </view>
                    <text class="size-x">×</text>
                    <view class="size-box">
                      <text class="size-tag">高</text>
                      <input v-model="form.height" class="size-input" type="number" placeholder="高" />
                      <text class="size-unit">px</text>
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </view>

          <!-- 2. 功能配置 -->
          <view v-show="activeTab === 'func'">
            <!-- 2A 参数 -->
            <view class="section">
              <view class="section-head">
                <view class="section-title">
                  <view class="bar" />
                  <text>A. 功能配置参数</text>
                </view>
                <text class="section-hint">固件版本与蓝牙信息</text>
              </view>

              <view class="grid">
                <view class="field">
                  <text class="label required">仪表软件版本</text>
                  <input v-model="form.meterVersion" class="input" placeholder="请输入仪表软件版本" />
                </view>
                <view class="field">
                  <text class="label required">TBox Modem 版本</text>
                  <input v-model="form.tboxModem" class="input" placeholder="请输入 TBox Modem 软件版本" />
                </view>
                <view class="field">
                  <text class="label required">TBox BLE 版本</text>
                  <input v-model="form.tboxBle" class="input" placeholder="请输入 TBox BLE 软件版本" />
                </view>
              </view>
            </view>

            <!-- 2B 功能清单开关 -->
            <view class="section">
              <view class="section-head">
                <view class="section-title">
                  <view class="bar" />
                  <text>B. 功能清单</text>
                </view>
                <view class="section-right">
                  <text class="section-hint">开启后可在仪表端直接控制该功能</text>
                  <text class="func-count">已启用 {{ enabledFuncCount }} / {{ form.funcs.length }} 项</text>
                  <wd-button plain type="primary" size="small" @click="openFuncDialog">+ 新增功能</wd-button>
                </view>
              </view>

              <view class="func-grid">
                <view v-for="fn in form.funcs" :key="fn.key" class="func-item">
                  <text class="func-name">{{ fn.name }}</text>
                  <input v-model="fn.code" class="func-code" placeholder="指令编码" />
                  <input v-model="fn.value" class="func-code" placeholder="参数值" />
                  <wd-switch v-model="fn.enabled" size="small" color="#165DFF" />
                </view>
              </view>
            </view>
          </view>

          <!-- 3. 主题壁纸音效设置 -->
          <view v-show="activeTab === 'content'">
            <!-- 3A 参数 -->
            <view class="section">
              <view class="section-head">
                <view class="section-title">
                  <view class="bar" />
                  <text>A. 主题壁纸音效参数</text>
                </view>
                <text class="section-hint">版本要求</text>
              </view>

              <view class="grid">
                <view class="field">
                  <text class="label required">仪表软件版本</text>
                  <input v-model="form.themeMeterVer" class="input" placeholder="请输入仪表软件版本要求" />
                </view>
                <view class="field">
                  <text class="label required">TBox Modem 版本</text>
                  <input v-model="form.themeModemVer" class="input" placeholder="请输入 TBox Modem 版本要求" />
                </view>
                <view class="field">
                  <text class="label required">TBox BLE 版本</text>
                  <input v-model="form.themeBleVer" class="input" placeholder="请输入 TBox BLE 版本要求" />
                </view>
              </view>
            </view>

            <!-- 3B 预置内容 -->
            <view class="section">
              <view class="section-head">
                <view class="section-title">
                  <view class="bar" />
                  <text>B. 预置内容</text>
                </view>
                <view class="section-right">
                  <text class="section-hint">主题样式、内置壁纸与内置音效</text>
                  <wd-button plain type="primary" size="small" @click="addTheme">+ 添加主题</wd-button>
                </view>
              </view>

              <view class="grid">
                <view class="field">
                  <text class="label required">最大添加壁纸数量</text>
                  <input v-model="form.maxWallpapers" class="input" type="number" placeholder="请输入最大添加壁纸数量" />
                </view>
                <view class="field">
                  <text class="label required">最大添加音效数量</text>
                  <input v-model="form.maxSounds" class="input" type="number" placeholder="请输入最大添加音效数量" />
                </view>
              </view>

            <view v-for="(th, ti) in form.themes" :key="ti" class="theme-card">
              <view class="theme-card-head">
                <text class="theme-card-title">主题 {{ ti + 1 }}</text>
                <text v-if="form.themes.length > 1" class="link-btn danger" @click="removeTheme(ti)">删除主题</text>
              </view>

              <view class="grid">
                <view class="field">
                  <text class="label required">主题名称</text>
                  <input v-model="th.name" class="input" placeholder="请输入主题名称" />
                </view>
              </view>

              <view class="upload-row">
                <text class="upload-label">主题图片</text>
                <view class="thumb">{{ th.themeImage ? '已传' : '无' }}</view>
                <text class="upload-btn" @click="uploadThemeImage(ti, 'themeImage')">↥ 上传图片</text>
                <text class="upload-hint">{{ th.themeImage ? th.themeImage : '暂无地址，请先上传' }}</text>
              </view>

              <view class="upload-row">
                <text class="upload-label">样式图片</text>
                <view class="thumb">{{ th.styleImage ? '已传' : '无' }}</view>
                <text class="upload-btn" @click="uploadThemeImage(ti, 'styleImage')">↥ 上传图片</text>
                <text class="upload-hint">{{ th.styleImage ? th.styleImage : '暂无地址，请先上传' }}</text>
              </view>

              <!-- 内置背景壁纸 -->
              <view class="sub-block">
                <view class="sub-head">
                  <text class="sub-title">内置背景壁纸</text>
                  <wd-button plain type="primary" size="small" @click="addWallpaper(ti)">+ 添加内置</wd-button>
                </view>

                <view class="inner-table">
                  <view class="inner-head">
                    <text class="icol icol-code">壁纸编码</text>
                    <text class="icol icol-preview">预览</text>
                    <text class="icol icol-upload">上传</text>
                    <text class="icol icol-url">资源地址</text>
                    <text class="icol icol-op">操作</text>
                  </view>

                  <view v-for="(wp, wi) in th.wallpapers" :key="wi" class="inner-row">
                    <view class="icol icol-code">
                      <input v-model="wp.code" class="mini-input" placeholder="0x01" />
                    </view>
                    <view class="icol icol-preview">
                      <view class="thumb">{{ wp.preview ? '已传' : '无' }}</view>
                    </view>
                    <view class="icol icol-upload">
                      <text class="upload-btn" @click="uploadWallpaper(ti, wi)">上传壁纸</text>
                    </view>
                    <text class="icol icol-url upload-hint">{{ wp.url || '暂无地址，请先上传' }}</text>
                    <text class="icol icol-op link-btn danger" @click="removeWallpaper(ti, wi)">删除</text>
                  </view>

                  <view v-if="!th.wallpapers.length" class="inner-empty">暂无内置壁纸</view>
                </view>
              </view>
            </view>

            <!-- 内置音效 -->
            <view class="sub-block">
              <view class="sub-head">
                <text class="sub-title">内置音效</text>
                <wd-button plain type="primary" size="small" @click="addSound">+ 添加内置</wd-button>
              </view>

              <view class="inner-table">
                <view class="inner-head">
                  <text class="icol icol-id">内置ID</text>
                  <text class="icol icol-code">音效编码</text>
                  <text class="icol icol-name">音效名称</text>
                  <text class="icol icol-upload">上传</text>
                  <text class="icol icol-url">资源地址</text>
                  <text class="icol icol-play">试听</text>
                  <text class="icol icol-op">操作</text>
                </view>

                <view v-for="(sd, si) in form.sounds" :key="si" class="inner-row">
                  <text class="icol icol-id">{{ sd.id }}</text>
                  <view class="icol icol-code">
                    <input v-model="sd.code" class="mini-input" placeholder="0x3E" />
                  </view>
                  <view class="icol icol-name">
                    <input v-model="sd.name" class="mini-input" placeholder="音效名称" />
                  </view>
                  <view class="icol icol-upload">
                    <text class="upload-btn" @click="uploadSound(si)">上传音效</text>
                  </view>
                  <text class="icol icol-url upload-hint">{{ sd.url || '暂无地址，请先上传' }}</text>
                  <view class="icol icol-play">
                    <text class="play-btn" @click="playSound(sd)">▶</text>
                    <view class="progress"><view class="progress-inner" /></view>
                    <text class="play-time">0:00 / --:--</text>
                  </view>
                  <text class="icol icol-op link-btn danger" @click="removeSound(si)">删除</text>
                </view>

                <view v-if="!form.sounds.length" class="inner-empty">暂无内置音效</view>
              </view>
            </view>
            </view>
          </view>
        </view>

        <view class="dialog-foot">
          <wd-button plain type="primary" size="small" @click="closeDialog">取消</wd-button>
          <wd-button type="primary" size="small" @click="confirmForm">
            {{ dialogMode === 'add' ? '确认新增' : '保存修改' }}
          </wd-button>
        </view>
      </view>

      <!-- 新增功能弹框 -->
      <view v-if="funcDialogVisible" class="mini-mask" @click.stop>
        <view class="mini-dialog">
          <view class="mini-dialog-head">
            <text class="mini-dialog-title">新增功能</text>
            <text class="mini-dialog-close" @click="funcDialogVisible = false">✕</text>
          </view>
          <view class="mini-dialog-body">
            <view class="mini-field">
              <text class="mini-label required">功能名称</text>
              <input v-model="funcDraft.name" class="input" placeholder="请输入功能名称" />
            </view>
            <view class="mini-field">
              <text class="mini-label required">指令代码</text>
              <input v-model="funcDraft.code" class="input" placeholder="请输入指令代码，如 0x01" />
            </view>
            <view class="mini-field">
              <text class="mini-label">参数值</text>
              <input v-model="funcDraft.value" class="input" placeholder="请输入参数值（选填）" />
            </view>
          </view>
          <view class="mini-dialog-foot">
            <wd-button plain type="primary" size="small" @click="funcDialogVisible = false">取消</wd-button>
            <wd-button type="primary" size="small" @click="confirmFunc">确认</wd-button>
          </view>
        </view>
      </view>
    </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
$primary: #165DFF;
$text-main: #1d2129;
$text-2: #4e5969;
$muted: #86909c;
$rule: #e5e6eb;
$danger: #f53f3f;

.page {
  min-height: 100vh;
  background: #f7f8fa;
  padding: 24rpx 32rpx 80rpx 242rpx;
  box-sizing: border-box;
}

/* 面包屑 */
.breadcrumb {
  font-size: 24rpx;
  color: $muted;
  margin-bottom: 20rpx;
  .link { color: $primary; cursor: pointer; }
  .sep { margin: 0 10rpx; }
  .cur { color: $text-main; }
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex-wrap: wrap;
  background: #fff;
  border: 2rpx solid $rule;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;

  picker { flex: 0 0 auto; }
  .filter-btns { display: flex; gap: 12rpx; margin-left: 8rpx; }
}

.select {
  min-width: 220rpx;
  height: 60rpx;
  line-height: 60rpx;
  padding: 0 24rpx;
  border: 2rpx solid $rule;
  border-radius: 8rpx;
  font-size: 24rpx;
  color: $text-main;
  background: #fff;
  box-sizing: border-box;
  &--empty { color: $muted; }
}

/* 工具条 */
.toolbar {
  display: flex;
  justify-content: flex-end;
  margin: 20rpx 0;
}

/* 表格 */
.table {
  background: #fff;
  border: 2rpx solid $rule;
  border-radius: 12rpx;
  overflow: hidden;
  font-size: 24rpx;
}

.table-head,
.table-row {
  display: flex;
  align-items: center;
  padding: 0 20rpx;
  min-height: 78rpx;
}

.table-head {
  background: #f7f8fa;
  color: $text-2;
  font-weight: 500;
  border-bottom: 2rpx solid $rule;
}

.table-row {
  border-bottom: 2rpx solid #f2f3f5;
  &:last-child { border-bottom: none; }
}

.col {
  padding: 8rpx 6rpx;
  box-sizing: border-box;
  color: $text-main;
  word-break: break-all;
}
.col-idx { width: 70rpx; flex-shrink: 0; }
.col-vendor { width: 110rpx; }
.col-model { width: 150rpx; }
.col-car { width: 200rpx; }
.col-fw { width: 150rpx; }
.col-size { width: 120rpx; }
.col-theme { width: 170rpx; }
.col-sound { width: 130rpx; }
.col-func { width: 130rpx; }
.col-status { width: 90rpx; }
.col-op {
  flex: 1;
  min-width: 220rpx;
  display: flex;
  justify-content: flex-end;
  gap: 20rpx;
}

.theme-name {
  display: block;
  font-size: 24rpx;
  color: $text-main;
}

.theme-sub {
  display: block;
  margin-top: 4rpx;
  font-size: 20rpx;
  color: $text-2;
}

.tag {
  display: inline-block;
  padding: 4rpx 14rpx;
  border-radius: 6rpx;
  font-size: 22rpx;
  &--on { color: $primary; background: rgba(22, 93, 255, 0.1); }
  &--off { color: $muted; background: #f2f3f5; }
  &--func { color: #00a870; background: rgba(0, 168, 112, 0.1); }
}

.link-btn {
  color: $primary;
  font-size: 24rpx;
  cursor: pointer;
  &.danger { color: $danger; }
}

.empty-row {
  padding: 60rpx 0;
  text-align: center;
  color: $muted;
  font-size: 24rpx;
}

/* 分页 */
.pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20rpx;
  font-size: 24rpx;
  color: $text-2;
}

.pager-ctrl {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.pager-btn {
  width: 48rpx;
  height: 48rpx;
  line-height: 48rpx;
  text-align: center;
  border: 2rpx solid $rule;
  border-radius: 8rpx;
  background: #fff;
  cursor: pointer;
  &--disabled { color: #c9cdd4; cursor: not-allowed; }
}

.pager-num {
  min-width: 48rpx;
  height: 48rpx;
  line-height: 48rpx;
  text-align: center;
  border: 2rpx solid $primary;
  border-radius: 8rpx;
  color: $primary;
  background: #fff;
}

.page-size {
  padding: 0 18rpx;
  height: 48rpx;
  line-height: 48rpx;
  border: 2rpx solid $rule;
  border-radius: 8rpx;
  background: #fff;
}

/* ==================== 弹窗 ==================== */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 40rpx;
}

.dialog {
  width: 94vw;
  max-width: 1320px;
  max-height: 90vh;
  background: #fff;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dialog-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  border-bottom: 2rpx solid $rule;
}

.dialog-title {
  font-size: 30rpx;
  font-weight: 600;
  color: $text-main;
}

.dialog-close {
  font-size: 28rpx;
  color: $muted;
  cursor: pointer;
  padding: 0 8rpx;
}

.dialog-body {
  padding: 24rpx 32rpx;
  overflow-y: auto;
  flex: 1;
}

/* Tab 页签 */
.tabs {
  display: flex;
  gap: 8rpx;
  padding: 0 32rpx;
  border-bottom: 2rpx solid $rule;
  background: #fff;
}

.tab {
  position: relative;
  padding: 20rpx 26rpx;
  font-size: 26rpx;
  color: $text-2;
  cursor: pointer;
  white-space: nowrap;
  border-bottom: 4rpx solid transparent;
  margin-bottom: -2rpx;

  &--active {
    color: $primary;
    font-weight: 600;
    border-bottom-color: $primary;
  }
}

.tab-badge {
  display: inline-block;
  min-width: 32rpx;
  padding: 0 8rpx;
  height: 32rpx;
  line-height: 32rpx;
  margin-left: 8rpx;
  text-align: center;
  font-size: 20rpx;
  color: #fff;
  background: $primary;
  border-radius: 16rpx;
}

.dialog-foot {
  display: flex;
  justify-content: flex-end;
  gap: 16rpx;
  padding: 20rpx 32rpx;
  border-top: 2rpx solid $rule;
  background: #fff;
}

/* 区块 */
.section {
  border: 2rpx solid $rule;
  border-radius: 12rpx;
  padding: 20rpx 24rpx 24rpx;
  margin-bottom: 24rpx;
  background: #fff;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
  flex-wrap: wrap;
  gap: 12rpx;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10rpx;
  font-size: 28rpx;
  font-weight: 600;
  color: $text-main;
  .bar {
    width: 6rpx;
    height: 28rpx;
    background: $primary;
    border-radius: 4rpx;
  }
}

.section-hint {
  font-size: 22rpx;
  color: $muted;
}

.section-right {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

/* 表单网格 */
.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx 40rpx;
}

.field {
  display: flex;
  align-items: center;
  gap: 12rpx;
  width: calc(50% - 20rpx);
  box-sizing: border-box;
}

.label {
  width: 260rpx;
  flex-shrink: 0;
  text-align: right;
  font-size: 24rpx;
  color: $text-main;
  white-space: nowrap;
  &.required::before {
    content: '*';
    color: $danger;
    margin-right: 6rpx;
  }
}

.input {
  flex: 1;
  height: 60rpx;
  line-height: 60rpx;
  padding: 0 20rpx;
  border: 2rpx solid $rule;
  border-radius: 8rpx;
  font-size: 24rpx;
  color: $text-main;
  background: #fff;
  box-sizing: border-box;
}

.field picker { flex: 1; }

.size-row {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.size-box {
  flex: 1;
  display: flex;
  align-items: center;
  height: 60rpx;
  border: 2rpx solid $rule;
  border-radius: 8rpx;
  overflow: hidden;
  background: #fff;
}

.size-tag {
  width: 52rpx;
  height: 100%;
  line-height: 56rpx;
  text-align: center;
  background: $primary;
  color: #fff;
  font-size: 22rpx;
  flex-shrink: 0;
}

.size-input {
  flex: 1;
  height: 56rpx;
  padding: 0 12rpx;
  font-size: 24rpx;
  min-width: 0;
}

.size-unit {
  padding-right: 14rpx;
  font-size: 22rpx;
  color: $muted;
}

.size-x {
  font-size: 24rpx;
  color: $muted;
}

/* 主题卡片 */
.theme-card {
  border: 2rpx dashed $rule;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-top: 16rpx;
}

.theme-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.theme-card-title {
  font-size: 24rpx;
  font-weight: 600;
  color: $text-2;
}

/* 上传行 */
.upload-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 16rpx;
}

.upload-label {
  width: 200rpx;
  flex-shrink: 0;
  text-align: right;
  font-size: 24rpx;
  color: $text-main;
}

.thumb {
  width: 72rpx;
  height: 60rpx;
  line-height: 56rpx;
  text-align: center;
  border: 2rpx solid $rule;
  border-radius: 6rpx;
  font-size: 20rpx;
  color: $muted;
  background: #fafafa;
  flex-shrink: 0;
}

.upload-btn {
  display: inline-block;
  padding: 8rpx 18rpx;
  border: 2rpx solid $primary;
  border-radius: 6rpx;
  color: $primary;
  font-size: 22rpx;
  background: #fff;
  cursor: pointer;
  white-space: nowrap;
}

.upload-hint {
  font-size: 22rpx;
  color: $muted;
  word-break: break-all;
}

/* 仪表功能项 */
.func-count {
  font-size: 22rpx;
  color: #00a870;
  font-weight: 500;
}

.func-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.func-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
  width: calc(33.33% - 12rpx);
  box-sizing: border-box;
  padding: 12rpx 16rpx;
  border: 2rpx solid $rule;
  border-radius: 8rpx;
  background: #fafbfc;
}

.func-name {
  flex: 1;
  min-width: 0;
  font-size: 23rpx;
  color: $text-main;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.func-code {
  width: 120rpx;
  flex-shrink: 0;
  height: 48rpx;
  padding: 0 8rpx;
  font-size: 20rpx;
  color: $text-main;
  background: #fff;
  border: 2rpx solid $rule;
  border-radius: 6rpx;
  box-sizing: border-box;
  text-align: center;
}

/* 新增功能弹框 */
.mini-mask {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mini-dialog {
  width: 760rpx;
  max-width: 560px;
  background: #fff;
  border-radius: 12rpx;
  box-shadow: 0 8rpx 40rpx rgba(0, 0, 0, 0.18);
  overflow: hidden;
}

.mini-dialog-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22rpx 24rpx;
  border-bottom: 2rpx solid $rule;
}

.mini-dialog-title {
  font-size: 28rpx;
  font-weight: 600;
  color: $text-main;
}

.mini-dialog-close {
  font-size: 28rpx;
  color: $text-2;
  cursor: pointer;
}

.mini-dialog-body {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.mini-field {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.mini-label {
  width: 170rpx;
  flex-shrink: 0;
  text-align: right;
  font-size: 24rpx;
  color: $text-main;
  white-space: nowrap;
}

.mini-dialog-foot {
  display: flex;
  justify-content: flex-end;
  gap: 16rpx;
  padding: 20rpx 24rpx;
  border-top: 2rpx solid $rule;
}

/* 子区块 */
.sub-block {
  margin-top: 20rpx;
  border: 2rpx dashed $rule;
  border-radius: 10rpx;
  padding: 16rpx;
}

.sub-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14rpx;
}

.sub-title {
  font-size: 24rpx;
  font-weight: 600;
  color: $text-2;
}

/* 内嵌表格 */
.inner-table {
  border: 2rpx solid $rule;
  border-radius: 8rpx;
  overflow: hidden;
  background: #fff;
}

.inner-head,
.inner-row {
  display: flex;
  align-items: center;
  padding: 10rpx 14rpx;
  font-size: 22rpx;
  gap: 10rpx;
}

.inner-head {
  background: #f7f8fa;
  color: $text-2;
  border-bottom: 2rpx solid $rule;
}

.inner-row {
  border-bottom: 2rpx solid #f2f3f5;
  &:last-child { border-bottom: none; }
}

.icol {
  box-sizing: border-box;
  min-width: 0;
}
.icol-id { width: 110rpx; flex-shrink: 0; color: $text-2; }
.icol-code { width: 130rpx; flex-shrink: 0; }
.icol-name { width: 160rpx; flex-shrink: 0; }
.icol-preview { width: 80rpx; flex-shrink: 0; }
.icol-upload { width: 130rpx; flex-shrink: 0; }
.icol-url { flex: 1; min-width: 120rpx; }
.icol-play { width: 280rpx; flex-shrink: 0; display: flex; align-items: center; gap: 8rpx; }
.icol-op { width: 80rpx; flex-shrink: 0; }

.mini-input {
  width: 100%;
  height: 52rpx;
  padding: 0 12rpx;
  border: 2rpx solid $rule;
  border-radius: 6rpx;
  font-size: 22rpx;
  box-sizing: border-box;
  background: #fff;
}

.inner-empty {
  padding: 30rpx 0;
  text-align: center;
  color: $muted;
  font-size: 22rpx;
}

.play-btn {
  width: 40rpx;
  height: 40rpx;
  line-height: 40rpx;
  text-align: center;
  border: 2rpx solid $primary;
  border-radius: 50%;
  color: $primary;
  font-size: 20rpx;
  flex-shrink: 0;
  cursor: pointer;
}

.progress {
  flex: 1;
  height: 8rpx;
  background: #f2f3f5;
  border-radius: 4rpx;
  overflow: hidden;
}

.progress-inner {
  width: 0;
  height: 100%;
  background: $primary;
}

.play-time {
  font-size: 20rpx;
  color: $muted;
  white-space: nowrap;
}
</style>
