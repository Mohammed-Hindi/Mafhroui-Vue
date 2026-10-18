<template>
  <div>
    <!-- صفحة "إرسال بيانات الدخول" (الإدارة العامة) — رأسها فقط، ومحتواها القسم الجماعي بالأسفل -->
    <header v-if="mode === 'credentials'" class="dash-head mb-6">
      <div>
        <h2 class="dash-title">إرسال بيانات الدخول</h2>
      </div>
    </header>

    <template v-else>
      <div class="mb-head-row mb-5">
        <nav class="hm-tabs w-fit" aria-label="نوع العضو">
          <button v-for="k in memberKindOptions" :key="k.value" type="button" :class="memberKind === k.value && 'is-active'" @click="memberKind = k.value">
            {{ k.label }} <span>{{ listOf(k.value).length }}</span>
          </button>
        </nav>
        <div class="dash-actions">
          <BaseButton variant="outline" :icon="Archive" @click="openTrashed">المحذوفون</BaseButton>
          <BaseButton :icon="UserPlus" @click="openAddModal">إضافة عضو</BaseButton>
        </div>
      </div>

      <div class="mb-toolbar mb-6" aria-label="تصفية الأعضاء">
        <label class="gr-search mb-toolbar-search">
          <Search :size="16" />
          <input v-model.trim="memberSearch" type="search" :placeholder="memberKind === 'student' ? 'بحث بالاسم أو الرقم الجامعي…' : 'بحث بالاسم أو الرقم الوظيفي…'">
        </label>
        <template v-if="memberKind === 'student'">
          <BaseSelect v-model="specFilter" class="min-w-[150px]" aria-label="التخصص" placeholder="كل التخصصات" include-placeholder-option :options="studentSpecOptions" />
          <BaseSelect v-model="studentSupFilter" class="min-w-[160px]" aria-label="المشرف" placeholder="كل المشرفين" include-placeholder-option :options="supervisorOptions" />
          <BaseSelect v-if="isSuperAdmin" v-model="genderFilter" class="min-w-[130px]" aria-label="الفئة" placeholder="طلاب وطالبات" include-placeholder-option :options="genderOptions" />
          <BaseSelect v-if="isSuperAdmin" v-model="regionFilter" class="min-w-[140px]" aria-label="مكان التواجد" placeholder="كل المناطق" include-placeholder-option :options="regionOptions" />
        </template>
        <BaseSelect v-if="memberKind === 'supervisor'" v-model="supSpecFilter" class="min-w-[150px]" aria-label="التخصص" placeholder="كل التخصصات" include-placeholder-option :options="specializationOptions" />
        <BaseSelect v-model="pageSize" class="min-w-[110px]" aria-label="عدد الصفوف" :options="pageSizeOptions" />
        <div class="mb-toolbar-end">
          <button type="button" class="mb-bulk-btn is-whats" :disabled="!whatsCount" :title="`إرسال رسالة واتساب إلى ${whatsCount} عضو`" @click="sendWhatsAll(activeList)">
            <MessageCircle :size="15" /> واتساب <b>{{ whatsCount }}</b>
          </button>
          <button type="button" class="mb-bulk-btn is-mail" :disabled="!mailCount" :title="`إرسال بريد إلى ${mailCount} عضو`" @click="sendMailAll(activeEmails)">
            <Mail :size="15" /> بريد <b>{{ mailCount }}</b>
          </button>
        </div>
      </div>

      <div class="mb-12">
        <SlideTable :rows="activeFiltered" :size="pageSize" :label="{ student: 'الطلاب', supervisor: 'المشرفون', committee: 'الأعضاء' }[memberKind]">
          <template #default="{ rows: shown }">
            <DataTable fixed class="mb-table" :class="isSuperAdmin && 'mb-rows-link'" :columns="activeColumns" :rows="shown" row-key="id" :primary-keys="['name', 'actions']" :loading="activeLoading" empty-title="لا توجد نتائج مطابقة" @row-click="isSuperAdmin && openProfile($event)">
              <!-- المجموعة: رقم الشعبة + المشرف تحته -->
              <template #cell-grp="{ row }">
                <template v-if="row.grp">
                  <component :is="isSuperAdmin ? 'span' : 'router-link'" :to="isSuperAdmin ? undefined : { name: 'committee-teams' }" class="inline-flex items-center gap-1.5 font-bold text-text-900">
                    {{ row.section ? 'شعبة ' + row.section : row.teamName }} <ExternalLink v-if="!isSuperAdmin" :size="11" class="opacity-65" />
                  </component>
                  <div class="text-caption text-text-400 mt-0.5">{{ row.sup || 'بلا مشرف' }}</div>
                </template>
                <span v-else class="text-caption text-text-400">غير منضم لمجموعة</span>
              </template>
              <template #cell-spec="{ row }">
                <div v-if="(row.specs && row.specs.length) || row.spec" class="flex flex-wrap gap-1">
                  <span v-for="sid in (row.specs && row.specs.length ? row.specs : [row.spec])" :key="sid" class="rv-pill">{{ specializationName(sid) }}</span>
                </div>
                <span v-else class="text-caption text-text-400">كل التخصصات</span>
              </template>
              <template #cell-who="{ row }">
                <div>{{ GENDERS[row.gender] || '—' }}</div>
                <div class="text-caption text-text-400 mt-0.5">{{ REGIONS[row.region] || 'غير محدد' }}</div>
              </template>
              <!-- التواصل: الواتس والبريد معًا -->
              <template #cell-contact="{ row }">
                <div @click.stop>
                  <button v-if="row.whats" type="button" class="gr-link mono" title="فتح واتساب" @click="sendWhats(row.whats)">{{ row.whats }}</button>
                  <span v-else class="text-text-400">—</span>
                </div>
                <div class="mt-0.5">
                  <button v-if="row.mail" type="button" class="gr-link mono text-caption whitespace-nowrap" title="إرسال بريد" @click="sendMail(row.mail)">{{ row.mail }}</button>
                  <span v-else class="text-caption text-text-400">—</span>
                </div>
              </template>
              <template #cell-name="{ row }">
                <div>
                  <button v-if="isSuperAdmin" type="button" class="mb-name font-bold" title="عرض البروفايل" @click.stop="openProfile(row)">{{ row.name }}</button>
                  <span v-else class="font-bold text-text-900">{{ row.name }}</span>
                  <span v-if="row.restricted" class="ms-1.5 text-label font-bold text-error bg-error-bg px-2 py-0.5 rounded-sm">موقوف</span>
                </div>
                <div class="mt-0.5"><span class="mono text-caption text-text-400">{{ (memberKind === 'student' ? row.uid : row.empId) || '—' }}</span></div>
                <div v-if="row.restricted && row.restrictedReason" class="text-label text-error mt-0.5">السبب: {{ row.restrictedReason }}</div>
              </template>
              <!-- المشرف ← مجموعاته (دليل الأعضاء — الإدارة العامة) -->
              <template #cell-groups="{ row }">
                <button v-if="supGroups(row.id).length" type="button" class="gr-link mb-groups-btn" :aria-expanded="openSupId === row.id" @click.stop="openSupId = openSupId === row.id ? null : row.id">
                  {{ supGroups(row.id).length }} مجموعات <ChevronDown :size="14" :class="openSupId === row.id && 'rotate-180'" />
                </button>
                <span v-else class="text-caption text-text-400">لا توجد</span>
              </template>
              <template v-if="isSuperAdmin && memberKind === 'supervisor'" #row-extra="{ row }">
                <!-- مجموعات المشرف بنفس قائمة سجل المجموعات: صف لكل مجموعة يُفتح على جدول طلابها -->
                <div v-if="openSupId === row.id" class="mb-sup-groups">
                  <table class="gr-table">
                    <thead>
                      <tr><th class="w-12" aria-label="فتح" /><th>الشعبة</th><th>المشروع</th><th>التخصص</th><th>الطلاب</th></tr>
                    </thead>
                    <tbody v-for="g in supGroups(row.id)" :key="g.id" :class="['gr-group', openGroupId === g.id && 'is-open']">
                      <tr class="gr-row" @click="openGroupId = openGroupId === g.id ? null : g.id">
                        <td>
                          <button type="button" class="gr-toggle" :aria-expanded="openGroupId === g.id" :aria-label="`طلاب ${g.name}`" @click.stop="openGroupId = openGroupId === g.id ? null : g.id">
                            <ChevronLeft :size="16" />
                          </button>
                        </td>
                        <td><span class="gr-section">{{ g.section || '—' }}</span></td>
                        <td class="gr-name-cell"><span class="gr-name">{{ g.project?.name || 'بلا مشروع' }}</span></td>
                        <td>{{ specializationName(g.specialization_id) }}</td>
                        <td>{{ (g.members || []).length }} طلاب</td>
                      </tr>
                      <tr v-if="openGroupId === g.id" class="gr-detail-row">
                        <td colspan="5">
                          <div class="gr-members mb-sup-members">
                            <table>
                              <thead><tr><th>الطالب</th><th>الرقم الجامعي</th><th>الجنس</th><th>مكان التواجد</th><th>الواتس</th></tr></thead>
                              <tbody>
                                <tr v-for="m in g.members || []" :key="m.id">
                                  <td><button type="button" class="gr-member-name gr-link" title="عرض بروفايل الطالب" @click="openProfile({ id: m.student?.id, name: m.student?.name }, 'student')"><span class="gm-av" aria-hidden="true">{{ (m.student?.name || '؟').charAt(0) }}</span>{{ m.student?.name }}</button></td>
                                  <td><span class="mono">{{ m.student?.university_number || '—' }}</span></td>
                                  <td><span :class="['gm-chip', m.student?.gender === 'female' && 'is-f']">{{ GENDERS[m.student?.gender] || 'غير محدد' }}</span></td>
                                  <td>{{ REGIONS[m.student?.region] || 'غير محدد' }}</td>
                                  <td>
                                    <button v-if="m.student?.whatsapp" type="button" class="gr-link mono" title="فتح واتساب" @click="sendWhats(m.student.whatsapp)">{{ m.student.whatsapp }}</button>
                                    <span v-else>—</span>
                                  </td>
                                </tr>
                                <tr v-if="!(g.members || []).length"><td colspan="5" class="gr-muted">لا يوجد طلاب في هذه المجموعة</td></tr>
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </template>
              <template #cell-lastActive="{ value }">
                <span v-if="value && value !== 'لم يسجّل دخولًا بعد'" class="inline-flex items-center gap-1.5 text-caption text-text-600"><span class="w-1.5 h-1.5 rounded-sm bg-primary-600" aria-hidden="true" />{{ value }}</span>
                <span v-else class="text-caption text-text-400">لم يسجّل دخولًا بعد</span>
              </template>
              <!-- كلمة السر: نص واحد يُنسخ بالنقر -->
              <template #cell-pw="{ row }">
                <div class="flex justify-center" @click.stop>
                  <button v-if="!passwords[row.id]" type="button" class="inline-flex items-center gap-2 h-9 px-4 rounded-sm border border-border text-body-sm font-bold text-text-600 hover:border-primary-600 hover:text-primary-600 hover:bg-primary-50 transition-colors duration-fast whitespace-nowrap" :disabled="generatingPwFor === row.id" @click="generatePw(row)">
                    <RefreshCw :size="15" /> {{ generatingPwFor === row.id ? 'جارٍ التوليد…' : 'توليد كلمة سر' }}
                  </button>
                  <button v-else type="button" class="inline-flex items-center h-8 px-2.5 rounded-sm border border-border bg-bg mono text-caption leading-none text-text-700 hover:border-primary-600 hover:text-primary-600 transition-colors duration-fast whitespace-nowrap" title="انقر لنسخ كلمة السر" @click="copyPw(row.id)">
                    {{ passwords[row.id] }}
                  </button>
                </div>
              </template>
              <template #cell-actions="{ row }">
                <div class="flex flex-wrap md:flex-nowrap justify-center gap-1.5" @click.stop>
                  <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-whatsapp-bg text-whatsapp hover:bg-whatsapp-bg disabled:opacity-40 disabled:pointer-events-none" :disabled="!row.whats" title="واتساب" @click="sendWhats(row.whats)"><MessageCircle :size="14" /></button>
                  <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-primary-100 text-primary-600 hover:bg-primary-50" title="بريد" @click="sendMail(row.mail)"><Mail :size="14" /></button>
                  <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-border text-text-600 hover:bg-border-soft hover:text-primary-700" title="تعديل" @click="openEdit(row, memberKind)"><Pencil :size="14" /></button>
                  <button v-if="isSuperAdmin && memberKind === 'supervisor'" type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-border text-text-600 hover:bg-border-soft hover:text-primary-700" title="القيود على وحدات النظام" @click="openModuleRestrict(row)"><SlidersHorizontal :size="14" /></button>
                  <button v-if="isSuperAdmin" type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-border text-text-600 hover:bg-border-soft hover:text-primary-700" :disabled="reinvitingId === row.id" title="نسخ رابط دعوة جديد" @click="quickReinvite(row)"><Link2 :size="14" /></button>
                  <button
                    type="button"
                    class="grid place-items-center w-8 h-8 rounded-sm border transition-colors duration-fast"
                    :class="row.restricted ? 'bg-error text-white border-error hover:brightness-95' : 'border-border text-text-600 hover:bg-error-bg hover:text-error'"
                    :title="row.restricted ? 'إلغاء الإيقاف' : (memberKind === 'student' ? 'إيقاف دخول الطالب' : 'إيقاف دخول المشرف')"
                    @click="toggleRestrict(row, memberKind)"
                  >
                    <Lock :size="14" />
                  </button>
                  <button type="button" class="grid place-items-center w-8 h-8 rounded-sm border border-error-bg text-error hover:bg-error-bg" title="حذف" @click="openDelete(row, memberKind)"><Trash2 :size="14" /></button>
                </div>
              </template>
            </DataTable>
          </template>
          <template #after>
            <div class="gr-sumbar mb-sumbar">
              <template v-if="memberKind === 'student'">
                <span>عدد الطلاب: {{ activeFiltered.length }}</span>
                <span>طلاب: {{ activeFiltered.filter((s) => s.gender === 'male').length }}</span>
                <span>طالبات: {{ activeFiltered.filter((s) => s.gender === 'female').length }}</span>
                <span>ضمن مجموعات: {{ activeFiltered.filter((s) => s.grp).length }}</span>
              </template>
              <template v-else-if="memberKind === 'supervisor'">
                <span>عدد المشرفين: {{ activeFiltered.length }}</span>
                <span>المجموعات: {{ activeFiltered.reduce((n, s) => n + supGroups(s.id).length, 0) }}</span>
                <span>الموقوفون: {{ activeFiltered.filter((s) => s.restricted).length }}</span>
              </template>
              <template v-else>
                <span>أعضاء لجنة الإشراف: {{ activeFiltered.length }}</span>
                <span>الموقوفون: {{ activeFiltered.filter((s) => s.restricted).length }}</span>
              </template>
            </div>
          </template>
        </SlideTable>
      </div>
    </template>

    <!-- ===================== إرسال بيانات الدخول الجماعي (صفحة مستقلة للإدارة العامة) =====================
         المسار: الفئة ← طريقة الإرسال ← تحديد المستلمين (المؤهَّلون فقط) ← مراجعة في نافذة تأكيد ← إرسال، ثم سجل الإرسال -->
    <template v-if="isSuperAdmin && mode === 'credentials'">
      <ol class="sp-steps cr-steps" aria-label="خطوات الإرسال">
        <li :class="notifySelectedIds.length ? 'is-done' : 'is-current'"><b>1</b><span>الفئة وطريقة الإرسال</span></li>
        <li :class="notifySelectedIds.length ? (crConfirmOpen ? 'is-done' : 'is-current') : ''"><b>2</b><span>تحديد المستلمين</span></li>
        <li :class="crConfirmOpen && 'is-current'"><b>3</b><span>المراجعة والإرسال</span></li>
      </ol>

      <section class="dash-card cr-card">
        <div class="dash-card-head">
          <h3>إرسال بيانات الدخول جماعيًا</h3>
          <span class="dash-chip">{{ notifyDirectoryLoading ? 'جارٍ التحميل…' : `${notifyDirectory.length} ${notifyRoleLabel}` }}</span>
        </div>

        <!-- 1. الفئة + طريقة الإرسال -->
        <div class="cr-setup">
          <div class="cr-field">
            <span class="cr-label">الفئة</span>
            <nav class="hm-tabs" aria-label="الفئة">
              <button v-for="r in crRoles" :key="r.value" type="button" :class="notifyRoleFilter === r.value && 'is-active'" @click="setNotifyRole(r.value)">
                <component :is="r.icon" :size="15" /> {{ r.label }}
              </button>
            </nav>
          </div>
          <div class="cr-field">
            <span class="cr-label">طريقة الإرسال</span>
            <div class="bc-channel-pick cr-channels">
              <label v-for="c in crChannels" :key="c.value" :class="['bc-channel-opt', notifyChannel === c.value && 'is-on']">
                <input type="radio" name="cr-channel" :value="c.value" :checked="notifyChannel === c.value" @change="setNotifyChannel(c.value)">
                <component :is="c.icon" :size="18" />
                <span><b>{{ c.label }}</b><small>{{ c.hint }}</small></span>
              </label>
            </div>
          </div>
        </div>

        <!-- 2. البحث والتخصص + شريط التحديد -->
        <div class="gr-filters cr-filters" aria-label="تصفية المستلمين">
          <label class="gr-search">
            <Search :size="16" />
            <input v-model.trim="notifySearch" type="search" placeholder="بحث بالاسم أو البريد أو الواتساب…">
          </label>
          <BaseSelect v-model="notifySpecFilter" class="min-w-[170px]" aria-label="التخصص" placeholder="كل التخصصات" include-placeholder-option :options="specializationOptions" />
        </div>

        <div class="cr-selbar">
          <label class="gp-check">
            <input type="checkbox" :checked="allNotifyFilteredSelected" :indeterminate.prop="someNotifyFilteredSelected" :disabled="!eligibleFiltered.length" @change="toggleNotifySelectAll">
            تحديد كل المؤهَّلين ({{ eligibleFiltered.length }})
          </label>
          <span class="cr-count"><b>{{ notifySelectedIds.length }}</b> محدَّد</span>
          <span v-if="ineligibleCount" class="cr-warn">{{ ineligibleCount }} بلا {{ notifyChannel === 'email' ? 'بريد' : 'واتساب' }} — غير قابل للتحديد</span>
          <button v-if="notifySelectedIds.length" type="button" class="cr-clear" @click="notifySelectedIds = []">إلغاء التحديد</button>
        </div>

        <SkeletonLoader v-if="notifyDirectoryLoading" variant="cards" />
        <EmptyState v-else-if="!filteredNotifyDirectory.length" :title="notifyDirectory.length ? 'لا يوجد عضو مطابق للبحث' : 'لا يوجد ' + notifyRoleLabel + ' حاليًا'" description="غيّر الفئة أو البحث أو التخصص" />
        <ul v-else class="cr-people" aria-label="المستلمون">
          <li v-for="u in filteredNotifyDirectory" :key="u.id">
            <label :class="['cr-person', notifySelectedIds.includes(u.id) && 'is-on', !contactOf(u) && 'is-off']">
              <input v-model="notifySelectedIds" type="checkbox" :value="u.id" :disabled="!contactOf(u)">
              <span class="hm-avatar cr-av" aria-hidden="true">{{ (u.name || '؟').charAt(0) }}</span>
              <span class="cr-who">
                <b>{{ u.name }}</b>
                <small v-if="contactOf(u)" class="mono">{{ contactOf(u) }}</small>
                <small v-else class="cr-missing">بلا {{ notifyChannel === 'email' ? 'بريد إلكتروني' : 'رقم واتساب' }}</small>
                <span v-if="u.specialization_id" class="cr-spec">{{ specializationName(u.specialization_id) }}</span>
              </span>
              <span class="cr-tick" aria-hidden="true"><Check :size="14" /></span>
            </label>
          </li>
        </ul>

        <!-- 3. شريط الإجراء الثابت أسفل البطاقة -->
        <div class="cr-actionbar">
          <p>
            <template v-if="notifySelectedIds.length">سيصل رابط الدعوة إلى <b>{{ notifySelectedIds.length }}</b> {{ notifyRoleLabel }} عبر <b>{{ notifyChannel === 'email' ? 'البريد الإلكتروني' : 'واتساب' }}</b></template>
            <template v-else>حدّد المستلمين من القائمة للمتابعة</template>
          </p>
          <button type="button" class="pbtn is-green" :disabled="!notifySelectedIds.length || crPreviewing" @click="openNotifyConfirm">
            <Send :size="16" /> {{ crPreviewing ? 'جارٍ التجهيز…' : 'مراجعة وإرسال' }}
          </button>
        </div>
      </section>

      <!-- سجل الإرسال -->
      <section class="dash-card cr-card mt-6">
        <div class="dash-card-head">
          <h3>سجلّ الإرسال</h3>
          <nav class="hm-tabs" aria-label="حالة الإرسال">
            <button v-for="s in crStatusTabs" :key="s.value" type="button" :class="deliveryStatusFilter === s.value && 'is-active'" @click="deliveryStatusFilter = s.value; loadDeliveries()">{{ s.label }}</button>
          </nav>
        </div>

        <SlideTable :rows="deliveryRows" label="الرسائل">
          <template #default="{ rows: shown }">
            <DataTable fixed :columns="deliveryColumns" :rows="shown" row-key="id" :primary-keys="['name', 'status']" :loading="deliveriesLoading" empty-title="لا توجد محاولات إرسال بعد">
              <template #cell-name="{ row }">
                <span class="cr-row-name"><span class="hm-avatar cr-av is-sm" aria-hidden="true">{{ row.name.charAt(0) }}</span><b>{{ row.name }}</b></span>
              </template>
              <template #cell-channel="{ value }">
                <span :class="['cr-chan', value === 'email' ? 'is-mail' : 'is-whats']"><component :is="value === 'email' ? 'Mail' : 'MessageCircle'" :size="13" /> {{ value === 'email' ? 'بريد' : 'واتساب' }}</span>
              </template>
              <template #cell-status="{ row }">
                <span :class="['rv-pill', `cr-st-${row.status}`]">{{ statusLabel(row.status) }}</span>
              </template>
              <template #cell-sentAt="{ value }"><span class="mono">{{ value }}</span></template>
              <template #cell-actions="{ row }">
                <button v-if="row.status === 'failed'" type="button" class="pbtn is-outline is-sm" :disabled="retryingDeliveryId === row.id" @click="retryDeliveryRow(row)">
                  <RotateCcw :size="14" /> {{ retryingDeliveryId === row.id ? 'جارٍ…' : 'إعادة المحاولة' }}
                </button>
              </template>
            </DataTable>
          </template>
          <template v-if="deliveryRows.length" #after>
            <div class="gr-sumbar">
              <span>المحاولات: {{ deliveryRows.length }}</span>
              <span>تم الإرسال: {{ deliveryRows.filter((d) => d.status === 'sent').length }}</span>
              <span>قيد الإرسال: {{ deliveryRows.filter((d) => d.status === 'pending').length }}</span>
              <span>فشل: {{ deliveryRows.filter((d) => d.status === 'failed').length }}</span>
            </div>
          </template>
        </SlideTable>
      </section>

      <!-- نافذة المراجعة والتأكيد -->
      <BaseModal v-model="crConfirmOpen" title="مراجعة الإرسال" :description="`رابط دعوة عبر ${notifyChannel === 'email' ? 'البريد الإلكتروني' : 'واتساب'} — ${notifyRoleLabel}`" size="sm">
        <template v-if="notifyPreviewResult">
          <div class="cr-review">
            <div class="is-ok"><b>{{ notifyPreviewResult.valid_count }}</b><span>جاهز للإرسال</span></div>
            <div :class="notifyPreviewResult.invalid_count ? 'is-bad' : 'is-muted'"><b>{{ notifyPreviewResult.invalid_count }}</b><span>غير مؤهَّل</span></div>
          </div>
          <div v-if="crNoInvite.length" class="palert is-info cr-fix">
            <span><b>{{ crNoInvite.length }}</b> بلا رابط دعوة نشط — أنشئ لهم روابط جديدة ثم تُعاد المراجعة تلقائيًا.</span>
            <button type="button" class="pbtn is-outline is-sm" :disabled="crInviting" @click="crCreateInvites"><Link2 :size="14" /> {{ crInviting ? `جارٍ الإنشاء… ${crInviteDone}/${crNoInvite.length}` : 'إنشاء روابط الدعوة' }}</button>
          </div>
          <p v-else-if="!notifyPreviewResult.valid_count" class="palert is-warning">لا يوجد مستلم مؤهَّل للإرسال.</p>
          <div v-if="notifyPreviewResult.invalid?.length" class="cr-invalid">
            <h4>لن يُرسَل إلى</h4>
            <ul>
              <li v-for="item in notifyPreviewResult.invalid" :key="item.user_id"><b>{{ item.name }}</b><span>{{ item.reason }}</span></li>
            </ul>
          </div>
        </template>
        <template #footer>
          <BaseButton variant="ghost" @click="crConfirmOpen = false">رجوع</BaseButton>
          <BaseButton :icon="Send" :loading="notifySending" :disabled="!notifyPreviewResult?.valid_count" @click="confirmSendNotify">تأكيد الإرسال ({{ notifyPreviewResult?.valid_count || 0 }})</BaseButton>
        </template>
      </BaseModal>
    </template>

    <!-- إضافة عضو -->
    <BaseModal v-model="addModalOpen" title="إضافة عضو جديد" description="يُنشأ الحساب وتُرسل بيانات الدخول للعضو عبر واتساب والبريد">
      <p v-if="addError" class="mf-error" role="alert"><AlertCircle :size="16" /> {{ addError }}</p>
      <div class="mf-form">
        <!-- 1. نوع العضو -->
        <div class="mf-sec">
          <h4>نوع العضو</h4>
          <div class="mf-roles" role="radiogroup" aria-label="نوع العضو">
            <button v-for="r in addRoleCards" :key="r.value" type="button" role="radio" :aria-checked="addForm.role === r.value" :class="['mf-role', addForm.role === r.value && 'is-on']" @click="addForm.role = r.value">
              <component :is="r.icon" :size="20" />
              <b>{{ r.label }}</b>
              <small>{{ r.hint }}</small>
            </button>
          </div>
        </div>

        <!-- 2. البيانات الأساسية -->
        <div class="mf-sec">
          <h4>البيانات الأساسية</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <BaseInput v-model="addForm.name" label="الاسم الكامل" :placeholder="addForm.role === 'student' ? 'مثال: أحمد خالد' : 'مثال: د. نورة العتيبي'" required class="sm:col-span-2" />
            <BaseInput v-if="addForm.role === 'student'" v-model="addForm.university_number" label="الرقم الجامعي" placeholder="اختياري" />
            <BaseInput v-else v-model="addForm.employee_number" label="الرقم الوظيفي" placeholder="اختياري" />
            <BaseInput v-model="addForm.whatsapp" label="رقم الواتساب" placeholder="970591234567" />
            <BaseInput v-model="addForm.email" type="email" label="البريد الإلكتروني" placeholder="name@ucas.edu.ps" class="sm:col-span-2" />
            <template v-if="addForm.role === 'student'">
              <BaseSelect v-model="addForm.gender" label="الجنس" placeholder="اختر الجنس" :options="addGenderOptions" required />
              <BaseSelect v-model="addForm.region" label="مكان التواجد" placeholder="اختر مكان التواجد" :options="addRegionOptions" required />
            </template>
          </div>
        </div>

        <!-- 3. تخصص عضو لجنة الإشراف: يرى بيانات هذا التخصص فقط -->
        <div v-if="addForm.role === 'committee'" class="mf-sec">
          <SpecializationPicker v-model="addForm.specialization_ids" :specializations="specializations" multiple :max="2" label="التخصص الذي ينتمي له" required hint="يمكن ربط عضو اللجنة بتخصص واحد أو تخصصين — يرى مجموعات ومشاريع ومقترحات تخصصاته فقط" />
        </div>
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="addModalOpen = false">إلغاء</BaseButton>
        <BaseButton :icon="Send" :loading="adding" :disabled="!addForm.name.trim() || (addForm.role === 'committee' && !addForm.specialization_ids.length)" @click="submitAdd">إضافة وإرسال بيانات الدخول</BaseButton>
      </template>
    </BaseModal>

    <!-- بيانات الحساب بعد الإنشاء -->
    <BaseModal v-model="inviteModalOpen" title="تم إنشاء الحساب" description="تم توليد كلمة سر مؤقتة وفتح واتساب/البريد لإرسالها للعضو تلقائيًا." size="sm">
      <label class="block mb-1.5 text-label font-semibold text-text-700">كلمة السر المؤقتة</label>
      <div class="flex items-center gap-2 mb-3">
        <input :value="inviteTarget?.password" readonly class="flex-1 min-w-0 h-icon-btn px-3 rounded-sm border border-border bg-bg text-body-sm mono">
        <BaseButton :icon="Copy" variant="outline" @click="copyInvitePassword">نسخ</BaseButton>
      </div>
      <label class="block mb-1.5 text-label font-semibold text-text-700">رابط الدعوة (بديل)</label>
      <div class="flex items-center gap-2">
        <input :value="inviteLink" readonly class="flex-1 min-w-0 h-icon-btn px-3 rounded-sm border border-border bg-bg text-body-sm mono">
        <BaseButton :icon="Copy" variant="outline" @click="copyInviteLink">نسخ</BaseButton>
      </div>
      <div class="flex items-center gap-2 mt-3">
        <BaseButton :icon="MessageCircle" variant="outline" class="flex-1" :disabled="!inviteTarget?.whats" @click="sendInviteWhats">إعادة الإرسال عبر واتساب</BaseButton>
        <BaseButton :icon="Mail" variant="outline" class="flex-1" :disabled="!inviteTarget?.mail" @click="sendInviteMail">إعادة الإرسال عبر البريد</BaseButton>
      </div>
      <template #footer>
        <BaseButton block @click="inviteModalOpen = false">تم</BaseButton>
      </template>
    </BaseModal>

    <BaseModal v-model="editModalOpen" :title="editKind === 'student' ? 'تعديل بيانات الطالب' : editKind === 'committee' ? 'تعديل بيانات عضو اللجنة' : 'تعديل بيانات المشرف'">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <template v-if="editKind === 'student'">
          <BaseInput v-model="editForm.name" label="اسم الطالب" class="sm:col-span-2" />
          <BaseInput v-model="editForm.uid" label="الرقم الجامعي" />
          <BaseInput v-model="editForm.whats" label="رقم الواتس" />
        </template>
        <template v-else>
          <BaseInput v-model="editForm.name" label="اسم الموظف" class="sm:col-span-2" />
          <BaseInput v-model="editForm.empId" label="الرقم الوظيفي" />
          <BaseInput v-model="editForm.whats" label="رقم الواتس" />
          <SpecializationPicker v-if="editKind === 'committee'" v-model="editForm.specs" :specializations="specializations" multiple :max="2" label="التخصص الذي ينتمي له" hint="تخصص واحد أو تخصصان" class="sm:col-span-2" />
        </template>
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="editModalOpen = false">إلغاء</BaseButton>
        <BaseButton :icon="Check" :loading="submitting" @click="saveEdit">حفظ التعديلات</BaseButton>
      </template>
    </BaseModal>

    <BaseModal v-model="restrictModal" title="إيقاف دخول العضو" :description="restrictTarget ? `سيتعذّر على ‏${restrictTarget.name} تسجيل الدخول حتى تُلغى الإيقاف` : ''" size="sm">
      <BaseInput v-model="restrictReason" label="سبب الإيقاف" placeholder="اكتبي سبب إيقاف هذا العضو" required />
      <template #footer>
        <BaseButton variant="ghost" @click="restrictModal = false">إلغاء</BaseButton>
        <BaseButton variant="danger" :icon="Lock" :loading="submitting" @click="confirmRestrict">تأكيد الإيقاف</BaseButton>
      </template>
    </BaseModal>

    <!-- القيود على وحدات النظام (سوبر أدمن — للمشرفين فقط) -->
    <BaseModal v-model="moduleRestrictModalOpen" title="قيود الصلاحيات" :description="moduleRestrictTarget ? `صلاحيات ${moduleRestrictTarget.name} على وحدات النظام` : ''">
      <div class="flex flex-col gap-4">
        <div v-for="mod in modules" :key="mod.value" class="flex items-center justify-between gap-4">
          <span class="text-body-sm font-bold text-text-900">{{ mod.label }}</span>
          <BaseSelect
            class="min-w-[170px]"
            :model-value="moduleRestrictLevels[mod.value]"
            :options="levelOptions"
            @update:model-value="setModuleLevel(mod.value, $event)"
          />
        </div>
        <BaseInput v-model="moduleRestrictReason" label="سبب التقييد" placeholder="سبب تقييد هذا المشرف — مطلوب عند اختيار مستوى غير 'كامل'" />
      </div>
      <template #footer>
        <BaseButton block @click="moduleRestrictModalOpen = false">تم</BaseButton>
      </template>
    </BaseModal>

    <!-- حذف مع سبب -->
    <BaseModal v-model="deleteModal" title="حذف العضو" :description="deleteTarget ? `سيُحذف حساب ${deleteTarget.name} ويمكن استرجاعه لاحقًا من 'الأعضاء المحذوفون'.` : ''" size="sm">
      <BaseInput v-model="deleteReason" label="سبب الحذف" placeholder="اكتبي سبب حذف هذا العضو" required />
      <template #footer>
        <BaseButton variant="ghost" @click="deleteModal = false">إلغاء</BaseButton>
        <BaseButton variant="danger" :icon="Trash2" :loading="submitting" @click="confirmDelete">تأكيد الحذف</BaseButton>
      </template>
    </BaseModal>

    <!-- الأعضاء المحذوفون -->
    <BaseModal v-model="trashedModal" title="الأعضاء المحذوفون" size="lg">
      <div v-if="trashedTabs.length > 1" class="hm-tabs mb-4">
        <button
          v-for="tab in trashedTabs" :key="tab.value" type="button"
          :class="trashedTab === tab.value && 'is-active'"
          @click="switchTrashedTab(tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>
      <SkeletonLoader v-if="trashedUsersLoading" :rows="3" height="60px" />
      <EmptyState v-else-if="!trashedUsers.length" :icon="Trash2" title="لا يوجد أعضاء محذوفون" />
      <SlideTable v-else v-slot="{ rows: shown }" :rows="trashedUsers" label="المحذوفون">
        <div class="flex flex-col gap-2">
          <div v-for="u in shown" :key="u.id" class="tr-row flex items-center justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <span class="tr-avatar grid place-items-center">{{ (u.name || '؟').trim().charAt(0) }}</span>
              <div class="min-w-0">
                <div class="font-bold text-text-900 truncate">{{ u.name }}</div>
                <div class="text-caption text-text-400 truncate">{{ u.email || u.whats || 'بدون بيانات تواصل' }}</div>
              </div>
            </div>
            <BaseButton variant="outline" size="sm" :icon="RotateCcw" :loading="restoringId === u.id" @click="confirmRestore(u)">استرجاع</BaseButton>
          </div>
        </div>
      </SlideTable>
      <template #footer>
        <BaseButton variant="ghost" @click="trashedModal = false">إغلاق</BaseButton>
      </template>
    </BaseModal>

    <EmailComposeModal v-model="emailComposeOpen" :to="emailComposeTarget" />

    <ProfileModal v-if="isSuperAdmin" v-model="profile.open" :kind="profile.kind" :person-id="profile.id" :name="profile.name" :preset="profile.preset" />
  </div>
</template>

<script>
import { GraduationCap, Users, UserCog, ShieldCheck, Search, MessageCircle, Mail, ExternalLink, Pencil, Lock, Check, Trash2, Archive, RotateCcw, RefreshCw, Eye, UserPlus, Send, Copy, SlidersHorizontal, Link2, ChevronDown, ChevronLeft, AlertCircle } from 'lucide-vue-next'
import { mapState, mapActions } from 'pinia'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import DataTable from '@/components/ui/DataTable.vue'
import SlideTable from '@/components/ui/SlideTable.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { useTeamsStore } from '@/stores/teams.store'
import { useUsersStore } from '@/stores/users.store'
import { useNotifyStore } from '@/stores/notify.store'
import { useAuthStore } from '@/stores/auth.store'
import { ROLES, APP_NAME } from '@/utils/constants'
import { formatDateTime } from '@/utils/formatters'
import { sendEmail, sendWhatsapp } from '@/services/api'
import EmailComposeModal from '@/components/shared/EmailComposeModal.vue'
import ProfileModal from '@/components/shared/ProfileModal.vue'
import SpecializationPicker from '@/components/shared/SpecializationPicker.vue'
import { GENDERS, REGIONS } from '@/utils/progressData'

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '').replace(/^0/, '')
}

const emptyAddForm = () => ({ role: 'student', name: '', employee_number: '', university_number: '', email: '', whatsapp: '', gender: '', region: '', specialization_id: '', specialization_ids: [] })

const MODULES = [
  { value: 'projects', label: 'المشاريع' },
  { value: 'proposals', label: 'المقترحات' },
  { value: 'tasks', label: 'المهام' },
  { value: 'meetings', label: 'الاجتماعات' }
]
const LEVEL_OPTIONS = [
  { value: 'full', label: 'كامل' },
  { value: 'view_only', label: 'عرض فقط' },
  { value: 'blocked', label: 'محظور' }
]

/** إرسال بيانات الدخول: الفئات وطرق الإرسال (ثابتة — خارج data حتى لا تُغلَّف الأيقونات تفاعليًا) */
const CR_ROLES = [
  { value: 'student', label: 'الطلاب', icon: GraduationCap },
  { value: 'supervisor', label: 'المشرفون', icon: UserCog },
  { value: 'committee', label: 'لجنة الإشراف', icon: ShieldCheck }
]
const CR_CHANNELS = [
  { value: 'email', label: 'البريد الإلكتروني', hint: 'رابط دعوة على بريد كل عضو', icon: Mail },
  { value: 'whatsapp', label: 'واتساب', hint: 'رابط دعوة برسالة واتساب', icon: MessageCircle }
]
const STATUS_LABELS = { pending: 'قيد الإرسال', sent: 'تم الإرسال', failed: 'فشل' }
const STATUS_VARIANTS = { pending: 'warning', sent: 'success', failed: 'error' }

export default {
  name: 'CommitteeMembersPage',

  components: { SpecializationPicker, Check, RotateCcw, Send, Copy, GraduationCap, Users, Search, MessageCircle, Mail, ExternalLink, Pencil, Lock, Archive, RefreshCw, Eye, Trash2, SlidersHorizontal, Link2, AlertCircle, BaseInput, BaseSelect, BaseButton, BaseBadge, BaseModal, DataTable, SlideTable, SkeletonLoader, EmptyState, EmailComposeModal, ProfileModal, ChevronDown, ChevronLeft },

  props: {
    /** 'members' = إدارة الأعضاء (افتراضي) · 'credentials' = صفحة إرسال بيانات الدخول (الإدارة العامة) */
    mode: { type: String, default: 'members' }
  },

  data() {
    return {
      GENDERS, REGIONS,
      // الإدارة العامة تبدأ بعرض الطلاب (الذكور) أولًا
      genderFilter: useAuthStore().userRole === ROLES.SUPER_ADMIN ? 'male' : '',
      regionFilter: '',
      assignedFilter: '',
      genderOptions: [{ value: 'male', label: 'طلاب' }, { value: 'female', label: 'طالبات' }],
      assignedOptions: [{ value: 'yes', label: 'ضمن مجموعة' }, { value: 'no', label: 'بدون مجموعة' }],
      pageSize: 25,
      pageSizeOptions: [{ value: 25, label: 'عرض 25' }, { value: 50, label: 'عرض 50' }, { value: 100, label: 'عرض 100' }],
      addError: '',
      openSupId: null,
      openGroupId: null,
      profile: { open: false, kind: 'student', id: null, name: '', preset: null },
      Check, Lock, Trash2, RotateCcw, Archive, UserPlus, Send, Copy, GraduationCap, Users,
      emailComposeOpen: false,
      emailComposeTarget: '',
      passwords: {},
      visiblePw: [],
      generatingPwFor: null,
      reinvitingId: null,
      // /super-admin/committee القديمة تحوّل هنا على تبويب اللجنة
      memberKind: ['student', 'supervisor', 'committee'].includes(this.$route?.query.kind) ? this.$route.query.kind : 'student',
      memberKindOptions: [
        { value: 'student', label: 'الطلاب' },
        { value: 'supervisor', label: 'المشرفون' },
        { value: 'committee', label: 'لجنة الإشراف' }
      ],
      memberSearch: '',
      supSpecFilter: '',
      specFilter: '',
      studentSupFilter: '',
      submitting: false,

      studentUsers: [],
      studentsLoading: false,
      supervisorUsers: [],
      supervisorsLoading: false,
      committeeUsers: [],
      committeeLoading: false,

      addModalOpen: false,
      addForm: emptyAddForm(),
      adding: false,

      inviteModalOpen: false,
      inviteLink: '',
      inviteTarget: null,

      editModalOpen: false,
      editKind: 'student',
      editTargetId: null,
      editForm: {},

      restrictModal: false,
      restrictTarget: null,
      restrictKind: 'student',
      restrictReason: '',

      moduleRestrictModalOpen: false,
      moduleRestrictTarget: null,
      moduleRestrictLevels: {},
      moduleRestrictReason: '',
      modules: MODULES,
      levelOptions: LEVEL_OPTIONS,

      deleteModal: false,
      deleteTarget: null,
      deleteKind: 'student',
      deleteReason: '',

      trashedModal: false,
      trashedTab: 'student',
      restoringId: null,


      /** إرسال بيانات الدخول الجماعي — سوبر أدمن فقط */
      notifyRoleFilter: 'student',
      notifyChannel: 'email',
      notifySpecFilter: '',
      notifySearch: '',
      notifySelectedIds: [],
      notifyPreviewResult: null,
      notifySending: false,
      notifyDirectory: [],
      notifyDirectoryLoading: false,
      deliveryStatusFilter: '',
      retryingDeliveryId: null,
      crConfirmOpen: false,
      crPreviewing: false,
      crInviting: false,
      crInviteDone: 0,
      crRoles: CR_ROLES,
      crChannels: CR_CHANNELS,
      crStatusTabs: [
        { value: '', label: 'الكل' },
        { value: 'sent', label: 'تم الإرسال' },
        { value: 'pending', label: 'قيد الإرسال' },
        { value: 'failed', label: 'فشل' }
      ],
      deliveryColumns: [
        { key: 'name', label: 'العضو' },
        { key: 'channel', label: 'الطريقة', className: 'w-[150px]' },
        { key: 'status', label: 'الحالة', className: 'w-[150px]' },
        { key: 'sentAt', label: 'وقت الإرسال', className: 'w-[200px]' },
        { key: 'actions', label: 'إجراء', className: 'w-[180px]' }
      ]
    }
  },

  computed: {
    ...mapState(useTeamsStore, ['teams', 'specializations']),
    ...mapState(useUsersStore, ['trashedUsers', 'trashedUsersLoading']),
    ...mapState(useNotifyStore, ['deliveries', 'deliveriesLoading']),
    ...mapState(useAuthStore, ['userRole']),

    isSuperAdmin() {
      return this.userRole === ROLES.SUPER_ADMIN
    },

    addRoleCards() {
      const hints = { student: 'ينضم لمجموعة مشروع', supervisor: 'يشرف على المجموعات', committee: 'مرتبط بتخصص واحد' }
      return this.addRoleOptions.map((o) => ({ ...o, icon: CR_ROLES.find((r) => r.value === o.value)?.icon, hint: hints[o.value] }))
    },
    addRoleOptions() {
      return [
        { value: 'student', label: 'الطلاب' },
        { value: 'supervisor', label: 'المشرفون' },
        ...(this.isSuperAdmin ? [{ value: 'committee', label: 'لجنة الإشراف' }] : [])
      ]
    },

    /** خريطة طالب → فريقه (لعمود رقم المجموعة والمشرف) — الفرق تُجلب لهذا الغرض فقط الآن */
    studentTeamMap() {
      const map = {}
      this.teams.forEach((team) => {
        (team.members || []).forEach((m) => {
          if (m.student?.id) map[m.student.id] = { team }
        })
      })
      return map
    },

    students() {
      return this.studentUsers.map((u) => {
        const entry = this.studentTeamMap[u.id]
        return {
          id: u.id,
          grp: entry?.team.id ?? null,
          section: entry?.team.section || '',
          teamName: entry?.team.name || '',
          spec: u.specialization_id,
          sup: entry?.team.supervisor?.name || null,
          name: u.name,
          uid: u.university_number,
          whats: u.whatsapp,
          mail: u.email,
          gender: u.gender,
          region: u.region,
          restricted: u.status === 'restricted',
          restrictedReason: u.restricted_reason
        }
      })
    },

    supervisors() {
      return this.supervisorUsers.map((u) => ({
        id: u.id,
        name: u.name,
        empId: u.employee_number,
        mail: u.email,
        whats: u.whatsapp,
        spec: u.specialization_id,
        // من الخادم: عدد مهام فرقه وآخر استخدام لجلسة الدخول
        tasks: u.tasks_count ?? 0,
        lastActive: u.last_active_at ? formatDateTime(u.last_active_at) : 'لم يسجّل دخولًا بعد',
        restricted: u.status === 'restricted',
        restrictedReason: u.restricted_reason
      }))
    },

    committee() {
      return this.committeeUsers.map((u) => ({
        id: u.id,
        name: u.name,
        empId: u.employee_number,
        mail: u.email,
        whats: u.whatsapp,
        spec: u.specialization_id,
        specs: (u.specialization_ids && u.specialization_ids.length) ? u.specialization_ids : (u.specialization_id ? [u.specialization_id] : []),
        restricted: u.status === 'restricted',
        restrictedReason: u.restricted_reason
      }))
    },

    specializationOptions() {
      return this.specializations.map((s) => ({ value: s.id, label: s.name }))
    },
    addGenderOptions() {
      return Object.entries(GENDERS).map(([value, label]) => ({ value, label }))
    },
    addRegionOptions() {
      return Object.entries(REGIONS).map(([value, label]) => ({ value, label }))
    },
    /** التخصصات المتاحة فعليًا: المشتقّة من طلاب المشرف المختار (أو كل الطلاب) */
    studentSpecOptions() {
      const pool = this.studentSupFilter ? this.students.filter((s) => s.sup === this.studentSupFilter) : this.students
      const ids = new Set(pool.map((s) => s.spec).filter(Boolean).map(String))
      const opts = this.specializations.filter((s) => ids.has(String(s.id))).map((s) => ({ value: s.id, label: s.name }))
      return opts.length ? opts : this.specializationOptions
    },
    /** المشرفون المتاحون: المشتقّون من الطلاب المطابقين للتخصص المختار (فقط من لهم طلاب) */
    supervisorOptions() {
      const pool = this.specFilter ? this.students.filter((s) => String(s.spec) === String(this.specFilter)) : this.students
      return [...new Set(pool.map((s) => s.sup).filter(Boolean))].map((name) => ({ value: name, label: name }))
    },
    regionOptions() {
      let src = this.students
      if (this.specFilter) src = src.filter((s) => String(s.spec) === String(this.specFilter))
      if (this.studentSupFilter) src = src.filter((s) => s.sup === this.studentSupFilter)
      const present = new Set(src.map((s) => s.region).filter(Boolean))
      const entries = Object.entries(REGIONS)
      return (present.size ? entries.filter(([v]) => present.has(v)) : entries).map(([value, label]) => ({ value, label }))
    },
    whatsCount() {
      return this.activeList.filter((m) => m.whats).length
    },
    mailCount() {
      return this.activeList.filter((m) => m.mail).length
    },
    studentEmails() {
      return this.students.map((s) => s.mail)
    },
    supervisorEmails() {
      return this.supervisors.map((s) => s.mail)
    },

    /** الجنس والمكان والبحث تُفلتر في الخادم؛ هنا فقط فلاتر اللجنة (التخصص/المشرف) المبنية على بيانات الفرق */
    filteredStudents() {
      return this.students.filter((s) =>
        (!this.specFilter || String(s.spec) === String(this.specFilter)) &&
        (!this.studentSupFilter || s.sup === this.studentSupFilter) &&
        (!this.assignedFilter || (this.assignedFilter === 'yes') === !!s.grp)
      )
    },

    /** القسم الموحّد (طلاب/مشرفون) — يبدّل حسب memberKind */
    /** ترتيب الأعمدة: الهوية ← الانتماء ← النشاط ← التواصل ← الحساب ← الإجراءات */
    activeColumns() {
      const actions = { key: 'actions', label: 'إجراءات', className: (this.isSuperAdmin ? 'w-[268px]' : 'w-[196px]') + ' !text-center' }
      const tail = [{ key: 'contact', label: 'التواصل', className: 'min-w-[220px]' }, { key: 'pw', label: 'كلمة السر', className: 'w-[190px] !text-center' }, actions]
      if (this.memberKind === 'student') {
        return [
          { key: 'name', label: 'الطالب / الرقم الجامعي', className: 'w-[190px]' },
          { key: 'grp', label: 'المجموعة / المشرف', className: 'w-[150px]' },
          { key: 'who', label: 'الفئة / مكان التواجد', className: 'w-[120px]' },
          ...tail
        ]
      }
      const name = { key: 'name', label: this.memberKind === 'committee' ? 'العضو / الرقم الوظيفي' : 'المشرف / الرقم الوظيفي', className: 'w-[230px]' }
      if (this.memberKind === 'committee') return [name, { key: 'spec', label: 'التخصص', className: 'w-[200px]' }, ...tail]
      if (!this.isSuperAdmin) return [name, ...tail]
      return [
        name,
        { key: 'groups', label: 'المجموعات', className: 'w-[130px]' },
        { key: 'lastActive', label: 'آخر نشاط', className: 'w-[150px]' },
        ...tail
      ]
    },
    activeList() {
      return this.listOf(this.memberKind)
    },
    activeFiltered() {
      return this.memberKind === 'student' ? this.filteredStudents : this.listOf(this.memberKind)
    },
    activeLoading() {
      return { student: this.studentsLoading, supervisor: this.supervisorsLoading, committee: this.committeeLoading }[this.memberKind]
    },
    activeEmails() {
      return this.activeList.map((s) => s.mail)
    },

    trashedTabs() {
      return this.isSuperAdmin
        ? [{ value: 'supervisor', label: 'المشرفون' }, { value: 'committee', label: 'لجنة الإشراف' }]
        : [{ value: 'student', label: 'الطلاب' }, { value: 'supervisor', label: 'المشرفون' }]
    },

    /** إرسال بيانات الدخول الجماعي */
    deliveryRows() {
      return this.deliveries.map((d) => ({
        id: d.id,
        name: d.user?.name || '—',
        channel: d.channel,
        status: d.status,
        sentAt: d.sent_at ? formatDateTime(d.sent_at) : '—'
      }))
    },
    filteredNotifyDirectory() {
      const q = this.notifySearch.trim().toLowerCase()
      return this.notifyDirectory.filter((u) => {
        const matchQ = !q || [u.name, u.email, u.whatsapp].some((v) => String(v || '').toLowerCase().includes(q))
        const matchSpec = !this.notifySpecFilter || u.specialization_id === this.notifySpecFilter
        return matchQ && matchSpec
      })
    },
    /** المؤهَّلون فقط (لديهم بريد/واتساب حسب طريقة الإرسال) قابلون للتحديد */
    eligibleFiltered() {
      return this.filteredNotifyDirectory.filter((u) => this.contactOf(u))
    },
    ineligibleCount() {
      return this.filteredNotifyDirectory.length - this.eligibleFiltered.length
    },
    allNotifyFilteredSelected() {
      return this.eligibleFiltered.length > 0 && this.eligibleFiltered.every((u) => this.notifySelectedIds.includes(u.id))
    },
    someNotifyFilteredSelected() {
      return !this.allNotifyFilteredSelected && this.eligibleFiltered.some((u) => this.notifySelectedIds.includes(u.id))
    },
    /** غير المؤهَّلين لأن رابط دعوتهم غير نشط — يمكن إصلاحهم من هنا */
    crNoInvite() {
      return (this.notifyPreviewResult?.invalid || []).filter((i) => String(i.reason || '').includes('دعوة'))
    },
    notifyRoleLabel() {
      return { student: 'طالب', supervisor: 'مشرف', committee: 'عضو لجنة' }[this.notifyRoleFilter]
    }
  },

  watch: {
    // كل فلتر مستقل: اختيار أحدهما يلغي الآخر، وأي تغيير يعيد الطلب من الخادم
    genderFilter(v) {
      if (v && this.regionFilter) this.regionFilter = ''
      else this.loadStudents()
    },
    regionFilter(v) {
      if (v && this.genderFilter) this.genderFilter = ''
      else this.loadStudents()
    },
    supSpecFilter() {
      this.loadSupervisors()
    },
    specFilter() {
      if (this.studentSupFilter && !this.supervisorOptions.some((o) => o.value === this.studentSupFilter)) this.studentSupFilter = ''
      if (this.regionFilter && !this.regionOptions.some((o) => o.value === this.regionFilter)) this.regionFilter = ''
    },
    studentSupFilter() {
      if (this.specFilter && !this.studentSpecOptions.some((o) => o.value === this.specFilter)) this.specFilter = ''
      if (this.regionFilter && !this.regionOptions.some((o) => o.value === this.regionFilter)) this.regionFilter = ''
    },
    // البحث يُرسل للخادم بعد توقف الكتابة
    memberSearch() {
      clearTimeout(this.searchTimer)
      this.searchTimer = setTimeout(() => this.reloadKind(this.memberKind), 350)
    },
    memberKind() {
      this.memberSearch = ''
    }
  },

  async created() {
    // قائمة أعضاء اللجنة للإدارة العامة فقط (الخادم يرفضها لعضو اللجنة)
    await Promise.all([this.loadStudents(), this.loadSupervisors(), this.isSuperAdmin && this.loadCommittee(), this.fetchTeams()])
    this.fetchSpecializations()
    if (this.isSuperAdmin) {
      this.loadNotifyDirectory()
      this.loadDeliveries()
    }
  },

  methods: {
    ...mapActions(useTeamsStore, ['fetchTeams', 'fetchSpecializations', 'specializationName']),
    ...mapActions(useUsersStore, [
      'fetchUsers', 'createUser', 'updateUser', 'updateUserStatus', 'reinviteUser',
      'fetchRestrictions', 'setRestriction', 'removeRestriction',
      'deleteUser', 'fetchTrashedUsers', 'restoreUser', 'setUserPassword'
    ]),
    ...mapActions(useNotifyStore, ['previewBulkNotify', 'sendBulkNotify', 'fetchDeliveries', 'retryDelivery']),


    /** مجموعات المشرف (من الفرق المحمّلة أصلًا) */
    supGroups(supId) {
      return this.teams.filter((t) => t.supervisor?.id === supId)
    },

    openProfile(row, kind = this.memberKind) {
      if (!row?.id) return
      if (kind === 'committee') {
        this.profile = {
          open: true, kind: 'committee', id: row.id, name: row.name,
          preset: {
            name: row.name,
            employee_number: row.empId,
            email: row.mail,
            whatsapp: row.whats,
            specializations: (row.specs && row.specs.length ? row.specs : (row.spec ? [row.spec] : [])).map((id) => this.specializationName(id))
          }
        }
        return
      }
      this.profile = { open: true, kind: kind === 'student' ? 'student' : 'supervisor', id: row.id, name: row.name, preset: null }
    },

    /** الفلاتر تُرسل للخادم (GET /users?role=…&gender=&region=&specialization_id=&search=) — القائمة المعروضة هي نتيجته */
    filterParams(kind) {
      const p = { search: this.memberSearch.trim() }
      if (kind === 'student') Object.assign(p, { gender: this.genderFilter, region: this.regionFilter })
      if (kind === 'supervisor') p.specialization_id = this.supSpecFilter
      return Object.fromEntries(Object.entries(p).filter(([, v]) => v !== '' && v != null))
    },
    async loadStudents() {
      this.studentsLoading = true
      try {
        this.studentUsers = await this.fetchUsers('student', this.filterParams('student'))
      } finally {
        this.studentsLoading = false
      }
    },
    async loadSupervisors() {
      this.supervisorsLoading = true
      try {
        this.supervisorUsers = await this.fetchUsers('supervisor', this.filterParams('supervisor'))
      } finally {
        this.supervisorsLoading = false
      }
    },
    listOf(kind) {
      return { student: this.students, supervisor: this.supervisors, committee: this.committee }[kind] || []
    },
    async loadCommittee() {
      this.committeeLoading = true
      try {
        this.committeeUsers = await this.fetchUsers('committee', this.filterParams('committee'))
      } catch {
        this.committeeUsers = [] // فشل تحميل اللجنة لا يوقف تحميل الطلاب والمشرفين
      } finally {
        this.committeeLoading = false
      }
    },
    async reloadKind(kind) {
      await ({ student: this.loadStudents, supervisor: this.loadSupervisors, committee: this.loadCommittee }[kind] || this.loadSupervisors)()
    },

    openAddModal() {
      // الدور الافتراضي = التبويب الحالي (الطلاب / المشرفون / لجنة الإشراف)
      const role = this.addRoleOptions.some((o) => o.value === this.memberKind) ? this.memberKind : 'student'
      this.addForm = { ...emptyAddForm(), role }
      this.addError = ''
      this.addModalOpen = true
    },
    async submitAdd() {
      this.addError = ''
      if (this.addForm.role === 'committee' && !this.addForm.specialization_ids.length) {
        this.addError = 'اختر تخصصًا واحدًا على الأقل لعضو اللجنة'
        return
      }
      if (this.addForm.role === 'student' && !this.addForm.gender) {
        this.addError = 'اختر جنس الطالب (طالب/طالبة) حتى يظهر في القائمة الصحيحة'
        return
      }
      if (this.addForm.role === 'student' && !this.addForm.region) {
        this.addError = 'اختر مكان تواجد الطالب'
        return
      }
      if (!this.addForm.name || !this.addForm.email) {
        this.addError = 'يرجى تعبئة الاسم والبريد الإلكتروني على الأقل'
        return
      }
      this.adding = true
      try {
        const { specialization_id, specialization_ids, ...rest } = this.addForm
        const payload = this.addForm.role === 'committee'
          ? { ...rest, specialization_ids }
          : rest
        Object.keys(payload).forEach((k) => { if (payload[k] === '') delete payload[k] })
        const result = await this.createUser(payload)
        const password = await this.setUserPassword(result.user.id)
        const created = { name: this.addForm.name, mail: this.addForm.email, whats: this.addForm.whatsapp, password, user_id: result.user.id }
        const role = this.addForm.role
        const addedGender = this.addForm.gender
        this.inviteTarget = created
        this.inviteLink = `${window.location.origin}/reset-password?token=${result.invite_token}`
        this.sendInviteWhats()
        this.sendInviteMail()
        this.addModalOpen = false
        this.addForm = emptyAddForm()
        this.$toast?.success(`تم إنشاء حساب ${created.name} وإرسال بيانات الدخول`)
        if (role === 'student') {
          this.memberKind = 'student'
          this.specFilter = ''
          this.studentSupFilter = ''
          this.regionFilter = ''
          this.assignedFilter = ''
          if (addedGender && this.genderFilter && this.genderFilter !== addedGender) this.genderFilter = addedGender
          else await this.reloadKind(role)
        } else {
          await this.reloadKind(role)
        }
      } catch (err) {
        this.addError = err.normalized?.message || 'تعذّر إنشاء الحساب — راجع البيانات وحاول مجددًا'
      } finally {
        this.adding = false
      }
    },

    inviteMessage() {
      return `مرحبًا ${this.inviteTarget?.name || ''}،\nتم إنشاء حسابك على منصة ${APP_NAME}.\nالبريد الإلكتروني: ${this.inviteTarget?.mail || ''}\nكلمة المرور: ${this.inviteTarget?.password || ''}\nرابط الدخول: ${window.location.origin}/login`
    },
    async copyInvitePassword() {
      try {
        await navigator.clipboard.writeText(this.inviteTarget?.password || '')
        this.$toast?.success('تم نسخ كلمة السر')
      } catch {
        this.$toast?.error('تعذّر نسخ كلمة السر')
      }
    },
    async sendInviteWhats() {
      if (!this.inviteTarget?.whats) return
      try {
        const res = await sendWhatsapp(
          { whats: this.inviteTarget.whats, name: this.inviteTarget.name, user_id: this.inviteTarget.user_id },
          this.inviteMessage(),
          'credentials'
        )
        if (res.queued) this.$toast?.success('تم إرسال بيانات الدخول عبر واتساب')
        else this.$toast?.error('رقم الواتساب غير صالح للإرسال')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إرسال رسالة واتساب')
      }
    },
    async sendInviteMail() {
      if (!this.inviteTarget?.mail) return
      try {
        await sendEmail({
          to: this.inviteTarget.mail,
          subject: `تم إنشاء حسابك على منصة ${APP_NAME}`,
          message: this.inviteMessage()
        })
        this.$toast?.success('تم إرسال البريد')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إرسال البريد')
      }
    },
    async copyInviteLink() {
      try {
        await navigator.clipboard.writeText(this.inviteLink)
        this.$toast?.success('تم نسخ الرابط')
      } catch {
        this.$toast?.error('تعذّر نسخ الرابط')
      }
    },

    /** سوبر أدمن فقط — رابط دعوة جديد لعضو موجود، يُنسخ للحافظة مباشرة */
    async quickReinvite(row) {
      this.reinvitingId = row.id
      try {
        const result = await this.reinviteUser(row.id)
        const link = `${window.location.origin}/reset-password?token=${result.token}`
        await navigator.clipboard.writeText(link)
        this.$toast?.success('تم نسخ رابط الدعوة الجديد')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إنشاء رابط الدعوة')
      } finally {
        this.reinvitingId = null
      }
    },

    openEdit(row, kind) {
      this.editKind = kind
      this.editTargetId = row.id
      this.editForm = this.editKind === 'student'
        ? { name: row.name, uid: row.uid || '', whats: row.whats || '' }
        : { name: row.name, empId: row.empId || '', whats: row.whats || '', specs: (row.specs && row.specs.length ? [...row.specs] : (row.spec ? [row.spec] : [])) }
      this.editModalOpen = true
    },
    async saveEdit() {
      if (!this.editForm.name) {
        this.$toast?.error('يرجى إدخال الاسم')
        return
      }
      if (this.editKind === 'committee' && !(this.editForm.specs && this.editForm.specs.length)) {
        this.$toast?.error('اختر تخصصًا واحدًا على الأقل لعضو اللجنة')
        return
      }
      this.submitting = true
      try {
        const payload = this.editKind === 'student'
          ? { name: this.editForm.name, university_number: this.editForm.uid, whatsapp: this.editForm.whats }
          : { name: this.editForm.name, employee_number: this.editForm.empId, whatsapp: this.editForm.whats, ...(this.editKind === 'committee' ? { specialization_ids: this.editForm.specs || [] } : {}) }
        await this.updateUser(this.editTargetId, payload)
        this.editModalOpen = false
        this.$toast?.success('تم حفظ التعديلات')
        await this.reloadKind(this.editKind)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر حفظ التعديلات')
      } finally {
        this.submitting = false
      }
    },

    toggleRestrict(row, kind) {
      this.restrictKind = kind
      if (row.restricted) {
        this.reactivate(row)
        return
      }
      this.restrictTarget = row
      this.restrictReason = ''
      this.restrictModal = true
    },
    async reactivate(row) {
      try {
        await this.updateUserStatus(row.id, 'active')
        this.$toast?.success('تم إلغاء الإيقاف')
        await this.reloadKind(this.restrictKind)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إلغاء الإيقاف')
      }
    },
    async confirmRestrict() {
      if (!this.restrictReason.trim()) {
        this.$toast?.error('يرجى إدخال سبب الإيقاف')
        return
      }
      this.submitting = true
      try {
        await this.updateUserStatus(this.restrictTarget.id, 'restricted', this.restrictReason.trim())
        this.restrictModal = false
        this.$toast?.success(`تم إيقاف دخول العضو — السبب: ${this.restrictReason.trim()}`)
        await this.reloadKind(this.restrictKind)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إيقاف العضو')
      } finally {
        this.submitting = false
      }
    },

    /** القيود على وحدات النظام — سوبر أدمن، للمشرفين فقط */
    async openModuleRestrict(row) {
      this.moduleRestrictTarget = row
      this.moduleRestrictReason = ''
      this.moduleRestrictLevels = Object.fromEntries(MODULES.map((m) => [m.value, 'full']))
      this.moduleRestrictModalOpen = true
      try {
        const restrictions = await this.fetchRestrictions(row.id)
        restrictions.forEach((r) => { this.moduleRestrictLevels[r.module] = r.level })
        this.moduleRestrictionIds = Object.fromEntries(restrictions.map((r) => [r.module, r.id]))
        this.moduleRestrictReason = restrictions[0]?.reason || ''
      } catch {
        this.$toast?.error('تعذّر تحميل القيود الحالية')
      }
    },
    async setModuleLevel(module, level) {
      if (level !== 'full' && !this.moduleRestrictReason.trim()) {
        this.$toast?.error('يرجى إدخال سبب التقييد أولًا')
        return
      }
      this.moduleRestrictLevels[module] = level
      try {
        if (level === 'full') {
          const id = this.moduleRestrictionIds?.[module]
          if (id) await this.removeRestriction(id)
        } else {
          await this.setRestriction(this.moduleRestrictTarget.id, module, level, this.moduleRestrictReason.trim())
        }
        this.$toast?.success(level === 'full' ? 'تم إلغاء القيد' : `تم تحديث القيد — السبب: ${this.moduleRestrictReason.trim()}`)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تحديث القيد')
      }
    },

    openDelete(row, kind) {
      this.deleteTarget = row
      this.deleteKind = kind
      this.deleteReason = ''
      this.deleteModal = true
    },
    async confirmDelete() {
      if (!this.deleteReason.trim()) {
        this.$toast?.error('يرجى إدخال سبب الحذف')
        return
      }
      this.submitting = true
      try {
        await this.deleteUser(this.deleteTarget.id, this.deleteReason.trim())
        this.deleteModal = false
        this.$toast?.success(`تم حذف العضو — السبب: ${this.deleteReason.trim()}`)
        await this.reloadKind(this.deleteKind)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر حذف العضو')
      } finally {
        this.submitting = false
      }
    },

    async openTrashed() {
      this.trashedTab = this.isSuperAdmin ? (this.memberKind === 'committee' ? 'committee' : 'supervisor') : 'student'
      this.trashedModal = true
      await this.loadTrashed()
    },
    async switchTrashedTab(value) {
      this.trashedTab = value
      await this.loadTrashed()
    },
    async loadTrashed() {
      try {
        await this.fetchTrashedUsers(this.trashedTab)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تحميل الأعضاء المحذوفين')
      }
    },
    async confirmRestore(user) {
      this.restoringId = user.id
      try {
        await this.restoreUser(user.id)
        this.$toast?.success(`تم استرجاع عضو ${user.name}`)
        await this.reloadKind(this.trashedTab)
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر استرجاع العضو')
      } finally {
        this.restoringId = null
      }
    },

    maskPw(pw) {
      return '•'.repeat(pw.length)
    },
    async copyPw(id) {
      try {
        await navigator.clipboard.writeText(this.passwords[id])
        this.$toast?.success('تم نسخ كلمة السر')
      } catch {
        this.$toast?.error('تعذّر نسخ كلمة السر')
      }
    },
    togglePw(id) {
      this.visiblePw = this.visiblePw.includes(id) ? this.visiblePw.filter((x) => x !== id) : [...this.visiblePw, id]
    },
    async generatePw(row) {
      this.generatingPwFor = row.id
      try {
        const password = await this.setUserPassword(row.id)
        this.passwords = { ...this.passwords, [row.id]: password }
        if (!this.visiblePw.includes(row.id)) this.visiblePw.push(row.id)
        this.$toast?.success('تم إنشاء كلمة سر جديدة')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تعيين كلمة السر')
      } finally {
        this.generatingPwFor = null
      }
    },

    sendWhats(whats) {
      if (!whats) return
      const num = digitsOnly(whats)
      const full = num.startsWith('970') || num.startsWith('972') ? num : `970${num}`
      window.open(`https://wa.me/${full}`, '_blank')
    },
    sendMail(mail) {
      if (!mail) return
      this.emailComposeTarget = mail
      this.emailComposeOpen = true
    },
    sendWhatsAll(list) {
      const contacts = list.filter((c) => c.whats)
      if (!contacts.length) return
      if (!window.confirm(`سيتم فتح ${contacts.length} محادثة واتساب في تبويبات منفصلة. متابعة؟`)) return
      contacts.forEach((c, i) => setTimeout(() => this.sendWhats(c.whats), i * 300))
    },
    sendMailAll(emails) {
      const url = `https://mail.google.com/mail/?view=cm&fs=1&bcc=${encodeURIComponent(emails.join(','))}&su=${encodeURIComponent('تعميم من لجنة الإشراف')}`
      window.open(url, '_blank')
    },

    /** إرسال بيانات الدخول الجماعي — سوبر أدمن فقط */
    async loadNotifyDirectory() {
      this.notifySelectedIds = []
      this.notifyPreviewResult = null
      this.notifySpecFilter = ''
      this.notifyDirectoryLoading = true
      try {
        this.notifyDirectory = await this.fetchUsers(this.notifyRoleFilter)
      } catch (_) {
        this.$toast?.error('تعذّر تحميل الأعضاء')
      } finally {
        this.notifyDirectoryLoading = false
      }
    },
    async loadDeliveries() {
      try {
        await this.fetchDeliveries(this.deliveryStatusFilter ? { status: this.deliveryStatusFilter } : {})
      } catch (_) {
        // الخطأ متاح عبر deliveriesError عند الحاجة
      }
    },
    toggleNotifySelectAll() {
      const filteredIds = this.eligibleFiltered.map((u) => u.id)
      this.notifySelectedIds = this.allNotifyFilteredSelected
        ? this.notifySelectedIds.filter((id) => !filteredIds.includes(id))
        : [...new Set([...this.notifySelectedIds, ...filteredIds])]
      this.notifyPreviewResult = null
    },
    async crCreateInvites() {
      this.crInviting = true
      this.crInviteDone = 0
      let failed = 0
      for (const item of this.crNoInvite) {
        try { await this.reinviteUser(item.user_id) } catch (_) { failed++ }
        this.crInviteDone++
      }
      try {
        this.notifyPreviewResult = await this.previewBulkNotify(this.notifySelectedIds, this.notifyChannel)
        this.$toast?.[failed ? 'warning' : 'success'](failed ? `تعذّر إنشاء ${failed} رابط` : 'تم إنشاء روابط الدعوة')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تحديث المراجعة')
      } finally {
        this.crInviting = false
      }
    },
    contactOf(u) {
      return this.notifyChannel === 'email' ? u.email : u.whatsapp
    },
    setNotifyRole(role) {
      if (role === this.notifyRoleFilter) return
      this.notifyRoleFilter = role
      this.loadNotifyDirectory()
    },
    /** تغيير طريقة الإرسال يُسقط من التحديد من لا يملك وسيلتها */
    setNotifyChannel(channel) {
      this.notifyChannel = channel
      const ok = new Set(this.notifyDirectory.filter((u) => this.contactOf(u)).map((u) => u.id))
      this.notifySelectedIds = this.notifySelectedIds.filter((id) => ok.has(id))
      this.notifyPreviewResult = null
    },
    /** المراجعة من الخادم ثم نافذة التأكيد (جاهز/غير مؤهَّل مع السبب) */
    async openNotifyConfirm() {
      this.crPreviewing = true
      try {
        this.notifyPreviewResult = await this.previewBulkNotify(this.notifySelectedIds, this.notifyChannel)
        this.crConfirmOpen = true
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر تجهيز المراجعة')
      } finally {
        this.crPreviewing = false
      }
    },
    async confirmSendNotify() {
      this.notifySending = true
      try {
        const result = await this.sendBulkNotify(this.notifySelectedIds, this.notifyChannel)
        this.$toast?.success(`تم إرسال ${result.dispatched.length} رسالة${result.skipped.length ? ` (تخطّي ${result.skipped.length})` : ''}`)
        this.crConfirmOpen = false
        this.notifyPreviewResult = null
        this.notifySelectedIds = []
        await this.loadDeliveries()
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إرسال الرسائل')
      } finally {
        this.notifySending = false
      }
    },
    async retryDeliveryRow(row) {
      this.retryingDeliveryId = row.id
      try {
        await this.retryDelivery(row.id)
        this.$toast?.success('تمت إعادة المحاولة')
      } catch (err) {
        this.$toast?.error(err.normalized?.message || 'تعذّر إعادة المحاولة')
      } finally {
        this.retryingDeliveryId = null
      }
    },
    statusLabel(status) {
      return STATUS_LABELS[status] || status
    },
    statusVariant(status) {
      return STATUS_VARIANTS[status] || 'neutral'
    }
  }
}
</script>

<style scoped>
.mono { direction: ltr; text-align: start; display: inline-block; }
.mb-sup-groups { padding: 12px 16px; background: var(--color-bg); overflow-x: auto; }
.mb-sup-groups .gr-table { min-width: 640px; background: var(--color-surface); box-shadow: var(--shadow-card); border-radius: 4px; }
.mb-sup-members { margin: 12px; }
/* قائمة مجموعات المشرف: بلا حركة ظهور (الصف الأب يعيد تشغيلها عند كل فتح) ورأس محايد بدل السماوي */
.mb-sup-groups :deep(tr),
:deep(tr:has(> td > .mb-sup-groups)) { animation: none !important; }
.mb-sup-groups :deep(.gr-table thead tr) { background: var(--color-bg) !important; }
.mb-sup-groups :deep(.gr-table > thead th) { color: var(--color-text-600) !important; border-bottom: 1px solid var(--color-border); }
.mb-sumbar { margin-top: 0; }
.mb-rows-link :deep(tbody > tr.row-interactive) { cursor: pointer; }
.mb-name { color: var(--portal-cyan, var(--color-primary-600)); text-align: start; }
.mb-name:hover { text-decoration: underline; }
.mb-head-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
.mb-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
.mb-toolbar-search { flex: 1 1 240px; min-width: 200px; }
.mb-toolbar-end { display: flex; flex-wrap: wrap; gap: 8px; margin-inline-start: auto; }
.mb-bulk-btn { display: inline-flex; align-items: center; gap: 7px; height: 38px; padding-inline: 14px; border-radius: 4px; border: 1px solid; background: var(--color-surface); font-size: 13px; font-weight: 700; cursor: pointer; transition: background-color .2s ease, color .2s ease, border-color .2s ease; }
.mb-bulk-btn b { display: inline-grid; place-items: center; min-width: 20px; height: 20px; padding-inline: 5px; border-radius: 4px; font-size: 12px; font-weight: 800; background: color-mix(in srgb, currentColor 14%, transparent); }
.mb-bulk-btn.is-whats { border-color: color-mix(in srgb, #25D366 50%, var(--color-border)); color: #1DA851; }
.mb-bulk-btn.is-whats:not(:disabled):hover { background: #25D366; border-color: #25D366; color: #FFFFFF; }
.mb-bulk-btn.is-mail { border-color: color-mix(in srgb, var(--ucas-blue) 45%, var(--color-border)); color: var(--ucas-blue); }
.mb-bulk-btn.is-mail:not(:disabled):hover { background: var(--ucas-blue); border-color: var(--ucas-blue); color: #FFFFFF; }
.mb-bulk-btn:disabled { opacity: .45; cursor: not-allowed; }
@media (max-width: 639.98px) { .mb-toolbar-end { width: 100%; margin-inline-start: 0; } .mb-bulk-btn { flex: 1; justify-content: center; } }
</style>
