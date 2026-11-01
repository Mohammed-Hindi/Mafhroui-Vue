<template>
  <!-- مواعيد المناقشات للإدارة العامة:
       إعدادات (القاعات لكل مكان + ساعاته الملزمة ← مدة الدبلوم/البكالوريوس ← الأيام حسب الفئة أو الدرجة) + سعة كل يوم ← توليد تلقائي بالقيود
       ← تعديل كل الجدول (قائمة أو شبكة حسب القاعات) مع كشف التعارضات فورًا ← طباعة حسب القاعات / Excel وإعادة رفعه ← نشر لكل مشرف جدوله -->
  <div class="dash dp-page">
    <!-- صفحة واحدة بسيطة: إعدادات (تنطوي بعد التوليد) ← الجدول ← التصدير والنشر ← جدول المشرف -->
    <!-- 1) إعدادات الجدولة — قابلة للطي -->
    <section id="dp-settings" class="dash-card">
      <div class="dash-card-head dp-set-head">
        <button type="button" class="dp-set-toggle" :aria-expanded="settingsOpen || !plan.length" @click="settingsOpen = !settingsOpen">
          <span class="dp-set-titles">
            <h3>إعدادات الجدولة</h3>
            <small class="dp-set-count">{{ loading ? 'جارٍ التحميل…' : `${groups.length} مجموعة لها مشروع` }}</small>
          </span>
          <ChevronDown v-if="plan.length" :size="18" :class="['dp-set-caret', settingsOpen && 'is-open']" />
        </button>
        <div class="dp-set-actions">
          <button type="button" class="pbtn is-outline dp-add-ex" @click="addEx.open = true"><UserPlus :size="16" /> مناقش خارجي</button>
          <button type="button" class="pbtn is-cyan dp-gen-btn" :disabled="loading || !!badWindows.length" @click="generate"><CalendarPlus :size="17" /> {{ plan.length ? 'إعادة توليد الجدول' : 'توليد الجدول' }}</button>
        </div>
      </div>

      <div v-show="!loading && (settingsOpen || !plan.length)" class="dp-set-body">
      <!-- القسم المستهدف أولًا: يحدّد أي مجموعات يبنيها التوليد (الباقي يبقى كما هو) -->
      <div class="dp-dept-bar">
        <span class="dp-dept-label"><Users :size="17" /> القسم المستهدف للتوليد</span>
        <select v-model="genDept" class="ev-input dp-dept-select" aria-label="قسم التوليد">
          <option value="">كل الأقسام</option>
          <option v-for="d in allDepts" :key="d" :value="d">{{ d }}</option>
        </select>
        <small>قسم محدَّد: يُجدوَل وحده وباقي الأقسام المجدولة تبقى كما هي بلا تداخل معها. «كل الأقسام»: يُجدوَل كل قسم على حدة بالتتابع بحيث لا يتداخل أي قسم مع الآخر.</small>
      </div>
      <!-- ترتيب أبسط: متى (الأيام) ← كم المدة ← أين (القاعات وساعاتها) -->
      <div class="dp-blocks">
        <!-- 1. الأيام: فئة لكل تقاطع (طلاب/طالبات × دبلوم/بكالوريوس) — يوم خاص لكل فئة -->
        <fieldset class="dp-block">
          <legend><span class="dp-no">1</span><CalendarDays :size="17" /> الأيام<small>يوم خاص لكل فئة: طلاب/طالبات × دبلوم/بكالوريوس</small></legend>
          <div class="dp-form">
            <label v-for="d in dayKeys" :key="d.key" class="pfield"><span>يوم {{ d.label }}</span><input v-model="s.days[d.key]" type="date"></label>
          </div>
        </fieldset>

        <!-- 2. مدة المناقشة لكل درجة (الأوقات تُقسَّم تلقائيًا ضمن ساعات كل مكان) + استراحة اختيارية -->
        <fieldset class="dp-block">
          <legend><span class="dp-no">2</span><Clock :size="17" /> مدة المناقشة والاستراحة</legend>
          <div class="dp-form">
            <label class="pfield"><span>مدة الدبلوم (دقيقة)</span><input v-model.number="s.durations.diploma" type="number" min="5" step="5"></label>
            <label class="pfield"><span>مدة البكالوريوس (دقيقة)</span><input v-model.number="s.durations.bachelor" type="number" min="5" step="5"></label>
          </div>
          <label class="gp-check dp-break-toggle"><input v-model="s.breakOn" type="checkbox"> استراحة (اختياري)</label>
          <div v-if="s.breakOn" class="dp-form">
            <label class="pfield"><span>الاستراحة من</span><input v-model="s.breakFrom" type="time"></label>
            <label class="pfield"><span>إلى</span><input v-model="s.breakTo" type="time"></label>
          </div>
        </fieldset>

        <!-- 3. القاعات: لكل مكان تواجد قاعاته، ونافذة ساعات ملزمة (مثل: الجنوب من 10:00 إلى 13:00) -->
        <fieldset class="dp-block dp-block-wide">
          <legend><span class="dp-no">3</span><DoorOpen :size="17" /> القاعات حسب مكان تواجد المجموعات<small>قاعات كل منطقة وساعاتها الملزمة</small></legend>
          <div class="dp-rooms">
            <div v-for="(label, key) in REGIONS" :key="key" class="dp-room-row">
              <span class="dp-room-label">{{ label }}<small>{{ regionCount(key) }} مجموعة</small></span>
              <div class="dp-chips">
                <span v-for="r in s.rooms[key]" :key="r" class="tk-picked-chip">
                  <span dir="ltr">{{ r }}</span>
                  <small class="dp-chip-hours" dir="ltr">{{ roomHoursLabel(r, key) }}</small>
                  <button type="button" :aria-label="`حذف القاعة ${r}`" @click="removeRoom(key, r)"><X :size="14" /></button>
                </span>
                <input
                  v-model.trim="roomDraft[key]" type="text" class="dp-chip-input" :placeholder="s.rooms[key].length ? 'إضافة قاعة…' : 'اكتب اسم القاعة ثم Enter'"
                  @keydown.enter.prevent="addRoom(key)" @keydown.188.prevent="addRoom(key)" @blur="addRoom(key)"
                >
              </div>
              <div :class="['dp-window', badWindows.includes(key) && 'is-invalid']" :title="'ساعات ملزمة لمجموعات ' + label">
                <span>من <b class="as-req">*</b></span><input v-model="s.windows[key].start" type="time" class="ev-input" required :aria-label="`بداية مناقشات ${label}`">
                <span>إلى <b class="as-req">*</b></span><input v-model="s.windows[key].end" type="time" class="ev-input" required :aria-label="`نهاية مناقشات ${label}`">
              </div>
            </div>
          </div>
          <small v-if="badWindows.length" class="dp-note is-bad">حدّد ساعات صحيحة (من قبل إلى) لـ: {{ badWindows.map((k) => REGIONS[k]).join('، ') }}</small>
        </fieldset>

        <!-- 4. المناقشون المتاحون (شيك بوكس): المشرف لا يناقش شعبه -->
        <fieldset class="dp-block dp-block-wide">
          <legend><span class="dp-no">4</span><Users :size="17" /> من يناقش؟<small>حدّد المناقشين المتاحين للتوليد؛ لا يناقش المشرف شُعبه</small></legend>
          <div class="dp-expick">
            <div class="dp-expick-head">
              <span>المناقشون المتاحون <b>({{ examinerPicks.length }})</b></span>
              <button type="button" class="pbtn is-outline is-sm" @click="toggleAllExaminers">{{ examinerPicks.length >= examinerAll.length ? 'إلغاء الكل' : 'تحديد الكل' }}</button>
            </div>
            <p v-if="!examinerAll.length" class="dp-note">جارٍ تحميل المناقشين…</p>
            <div v-for="grp in examinerOptions" :key="grp.label" class="dp-expick-grp">
              <b class="dp-expick-label">{{ grp.label }}</b>
              <div class="dp-expick-chips">
                <label v-for="e in grp.items" :key="e.id" :class="['gp-item dp-expick-chip', pickedSet.has(e.id) && 'is-on']">
                  <input type="checkbox" :value="e.id" v-model="examinerPicks"><span>{{ e.name }}</span>
                </label>
              </div>
            </div>
            <small class="dp-note">يُوزَّع التوليد من المحدَّدين فقط، ولا يُسنَد مشرف لمناقشة إحدى شُعبه.</small>
          </div>
        </fieldset>
      </div>

      <!-- سعة كل يوم بالدقائق (لأن مدة الدبلوم تختلف عن البكالوريوس) -->
      <div class="dp-capacity">
        <div v-for="c in capacity" :key="c.key" :class="['dp-cap', c.ok ? 'is-ok' : 'is-bad']">
          <div class="dp-cap-head">
            <span class="dp-cap-ic"><CalendarDays :size="18" /></span>
            <b>يوم {{ c.label }}</b>
            <span class="mono">{{ c.date || '—' }}</span>
            <span v-if="!c.ok" class="dp-cap-state is-bad">الوقت غير كافٍ</span>
          </div>
          <div class="dp-cap-num"><b>{{ c.groups }}</b> مجموعة · تحتاج <b>{{ c.need }}</b> من <b>{{ c.have }}</b> دقيقة</div>
          <div class="dp-cap-bar"><span :style="{ width: Math.min(100, c.have ? (c.need / c.have) * 100 : 100) + '%' }" /></div>
        </div>
      </div>

      </div>
    </section>

    <!-- حالة فارغة: قبل توليد الجدول يرشد المستخدم للخطوة التالية (اختيار المناقشين والفلترة تظهر بعد التوليد) -->
    <section v-if="!loading && !plan.length" class="dash-card dp-empty">
      <CalendarPlus :size="34" />
      <h3>ابدأ ببناء جدول المناقشات</h3>
      <p>بعد ضبط الأيام والمدة والقاعات في الإعدادات بالأعلى، اضغط <b>«توليد الجدول»</b> ليُبنى جدول بلا تعارضات.
        عندها يظهر لكل مجموعة <b>اختيار المناقشَين</b> (من المشرفين ولجنة الإشراف والمناقشين الخارجيين)، و<b>فلتر القسم</b>، مع كشف التعارض فورًا — وكلها قابلة للتعديل.</p>
      <p class="dp-empty-sub">تقدر كمان تضيف <b>مناقشًا خارجيًا</b> (ليس مشرفًا ولا لجنة) من زر «مناقش خارجي» بالأعلى ليصبح متاحًا في القوائم.</p>
      <button type="button" class="pbtn is-cyan" :disabled="!!badWindows.length" @click="generate"><CalendarPlus :size="17" /> توليد الجدول</button>
      <small v-if="badWindows.length" class="dp-empty-warn">حدّد ساعات المكان لـ {{ badWindows.map((k) => REGIONS[k]).join('، ') }} أولًا</small>
    </section>

    <!-- 2) جدول المناقشات -->
    <section v-if="plan.length" id="dp-table" class="dash-card">
      <!-- التصدير والنشر قبال العنوان في رأس البطاقة (أفخم) -->
      <div class="dash-card-head dp-table-head">
        <h3>جدول المناقشات</h3>
        <div class="dp-tablebar">
          <div class="dp-publish-row">
            <button type="button" class="pbtn is-green dp-publish-go" :disabled="!!conflictCount || saving" :title="conflictCount ? 'عالج التعارضات أولًا' : ''" @click="publish"><Send :size="16" /> نشر للمشرفين</button>
            <button type="button" class="pbtn is-outline" :disabled="saving" @click="saveDraft"><Save :size="16" /> {{ saving ? 'جارٍ الحفظ…' : 'حفظ كمسودة' }}</button>
          </div>
          <div class="dp-export-row">
            <button type="button" class="pbtn is-outline" :disabled="busy" @click="printPlan"><Printer :size="16" /> طباعة الجدول</button>
            <button type="button" class="pbtn is-outline" :disabled="busy" @click="openRoomPrint"><DoorOpen :size="16" /> طباعة حسب القاعات</button>
            <button type="button" class="pbtn is-outline" :disabled="busy" @click="downloadWord"><FileText :size="16" /> Word</button>
            <button type="button" class="pbtn is-outline" :disabled="busy" @click="downloadExcel"><FileSpreadsheet :size="16" /> Excel</button>
            <label class="pbtn is-outline dp-upload"><Upload :size="16" /> إعادة رفع Excel<input type="file" accept=".xlsx" hidden @change="reupload"></label>
          </div>
        </div>
      </div>

      <!-- أرقام سريعة عن الجدول -->
      <div class="dp-kpis">
        <div v-for="k in kpis" :key="k.label" :class="['dp-kpi', k.tone]"><b>{{ k.value }}</b><span>{{ k.label }}</span></div>
      </div>

      <!-- ملخص التعارضات المضغوط بدل قائمة طويلة -->
      <div v-if="conflictCount" class="dp-issues">
        <AlertTriangle :size="18" />
        <span v-for="it in issueSummary" :key="it.label"><b>{{ it.count }}</b> {{ it.label }}</span>
        <button type="button" class="pbtn is-outline is-sm" @click="onlyConflicts = !onlyConflicts">{{ onlyConflicts ? 'عرض الكل' : 'عرض المتعارضة فقط' }}</button>
      </div>

      <div class="dp-toolbar gr-filters">
        <!-- طريقة العرض تبقى مفتاح عرض (قائمة/شبكة) لا فلتر؛ واليوم والقاعة فلاتر بنمطنا -->
        <nav class="hm-tabs" aria-label="طريقة العرض">
          <button type="button" :class="view === 'list' && 'is-active'" @click="view = 'list'"><List :size="15" /> قائمة</button>
          <button type="button" :class="view === 'rooms' && 'is-active'" @click="view = 'rooms'"><LayoutGrid :size="15" /> حسب القاعات</button>
        </nav>
        <label class="gr-pick">
          <select v-model="day" class="gr-select" aria-label="اليوم">
            <option v-for="t in dayTabs" :key="t.value" :value="t.value">{{ t.label }}</option>
          </select>
        </label>
        <label v-if="view === 'list'" class="gr-pick">
          <select v-model="roomFilter" class="gr-select" aria-label="القاعة">
            <option value="">كل القاعات</option>
            <option v-for="r in allRooms" :key="r" :value="r">{{ r }}</option>
          </select>
        </label>
        <label v-if="deptList.length" class="gr-pick">
          <select v-model="deptFilter" class="gr-select" aria-label="القسم">
            <option value="">كل الأقسام</option>
            <option v-for="d in deptList" :key="d" :value="d">{{ d }}</option>
          </select>
        </label>
      </div>

      <!-- عرض القائمة: أعمدة مضغوطة (حقلان فوق بعض) بلا تمرير أفقي، وسبب التعارض تحت الصف مباشرة -->
      <!-- أكثر من 5 مناقشات: سلايدر بنفس هوية باقي الصفحات -->
      <!-- مراجعة الجدول: كل المناقشات في جدول واحد يُمرَّر داخليًا (رأس ثابت) بدل السلايدر -->
      <template v-if="view === 'list'">
      <div class="pt-wrap dp-scroll dp-review-scroll">
        <table class="pt dp-table">
          <thead>
            <tr><th>المجموعة</th><th>الفئة والمكان</th><th>الموعد</th><th>القاعة</th><th>المناقشان</th><th>ملاحظات</th></tr>
          </thead>
          <tbody v-for="r in visiblePlan" :key="r.id" :data-row="r.id" :class="conflicts[r.id] && 'is-conflict'">
            <tr>
              <td class="dp-group">
                <button type="button" class="dp-sec" title="تفاصيل المناقشة" @click="detail = r">{{ r.g.section }}</button>
                <span class="dp-meta"><button type="button" class="dp-suplink" title="معلومات المشرف" @click="openSup(r.g.supId)">{{ supName(r.g.supId) }}</button>{{ DEGREES[r.g.degree] }} · {{ r.g.members.length }} طلاب</span>
              </td>
              <td class="dp-stack">
                <select v-model="r.gender" class="ev-input" aria-label="الفئة" @change="r.date = dayOf(r)">
                  <option value="female">طالبات</option><option value="male">طلاب</option>
                </select>
                <select v-model="r.region" class="ev-input" aria-label="مكان التواجد" @change="r.room = roomsOf(r.region).includes(r.room) ? r.room : ''">
                  <option v-for="(l, k) in REGIONS" :key="k" :value="k">{{ l }}</option>
                </select>
              </td>
              <td class="dp-stack">
                <input v-model="r.date" type="date" class="ev-input" aria-label="التاريخ">
                <input v-model="r.time" type="time" class="ev-input" aria-label="الوقت">
              </td>
              <td>
                <select v-model="r.room" class="ev-input dp-room" aria-label="القاعة">
                  <option value="">—</option>
                  <option v-for="room in roomsOf(r.region)" :key="room" :value="room">{{ room }}</option>
                </select>
              </td>
              <td class="dp-stack dp-examiners">
                <select v-for="k in [0, 1]" :key="k" v-model="r.examiners[k]" class="ev-input" :aria-label="k ? 'المناقش الثاني' : 'المناقش الأول'">
                  <option :value="null">{{ k ? 'المناقش الثاني' : 'المناقش الأول' }}</option>
                  <optgroup v-for="grp in examinerOptions" :key="grp.label" :label="grp.label">
                    <option v-for="sp in grp.items" :key="sp.id" :value="sp.id" :disabled="sp.id === r.g.supId">
                      {{ sp.name }}{{ sp.id === r.g.supId ? ' (المشرف)' : isBusy(sp.id, r) ? ' (مشغول)' : '' }}
                    </option>
                  </optgroup>
                </select>
              </td>
              <td><input v-model.trim="r.note" type="text" class="ev-input" placeholder="مثال: Online"></td>
            </tr>
            <tr v-if="conflicts[r.id]" class="dp-why">
              <td colspan="6">
                <div class="dp-why-msg"><AlertTriangle :size="14" /><span>{{ conflicts[r.id].join(' · ') }}</span></div>
                <div class="dp-free">
                  <span>الأوقات المتاحة في القاعات ({{ dayOf(r) }}):</span>
                  <button v-for="o in freeSlots(r)" :key="o.room + o.time" type="button" class="dp-free-opt" :title="`نقل المناقشة إلى ${o.room} الساعة ${o.time}`" @click="applySlot(r, o)">
                    <b dir="ltr">{{ o.time }}</b> <span dir="ltr">{{ o.room }}</span>
                  </button>
                  <em v-if="!freeSlots(r).length">لا يوجد وقت متاح لكل الأطراف — غيّر المناقشين أو وسّع ساعات المكان</em>
                </div>
              </td>
            </tr>
          </tbody>
          <tbody v-if="!visiblePlan.length"><tr><td colspan="6" class="gr-empty">لا توجد مناقشات مطابقة</td></tr></tbody>
        </table>
      </div>
      </template>

      <!-- عرض حسب القاعات: شبكة (الوقت × القاعة) لليوم المختار -->
      <div v-else class="dp-grid-wrap">
        <p v-if="!gridDay" class="pt-muted">اختر يومًا لعرض شبكة القاعات.</p>
        <table v-else class="dp-grid">
          <thead><tr><th>الوقت</th><th v-for="room in gridRooms" :key="room" dir="ltr">{{ room }}</th></tr></thead>
          <tbody>
            <tr v-for="t in gridTimes" :key="t">
              <th class="mono">{{ t }}</th>
              <td v-for="room in gridRooms" :key="room">
                <div v-for="r in cell(t, room)" :key="r.id" :class="['dp-slot', conflicts[r.id] && 'is-conflict']" role="button" tabindex="0" :title="(conflicts[r.id] || []).join(' · ') || 'تفاصيل المناقشة'" @click="detail = r" @keydown.enter="detail = r">
                  <b>{{ r.g.section }}</b>
                  <span>المشرف: {{ supName(r.g.supId) }}</span>
                  <span>{{ r.examiners.filter(Boolean).map(supName).join('، ') || 'بلا مناقشين' }}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="unscheduled.length" class="dp-unsched">
          <b>بلا موعد ({{ unscheduled.length }}):</b>
          <span v-for="r in unscheduled" :key="r.id" class="tk-picked-chip">{{ r.g.section }}</span>
        </p>
      </div>

    </section>

    <!-- 3) جدول كل مشرف بعد النشر -->
    <section v-if="plan.length" class="dash-card">
      <div class="dash-card-head">
        <h3>جدول مناقشات المشرف</h3>
        <span class="dash-chip">{{ published ? `آخر نشر: ${published.at}` : 'لم يُنشر بعد' }}</span>
      </div>
      <template v-if="published">
        <div class="gr-filters dp-sup-bar">
          <label class="gr-pick">
            <select v-model="supView" class="gr-select" aria-label="المشرف" @change="supRoom = ''">
              <option v-for="sp in supList" :key="sp.id" :value="sp.id">{{ sp.name }}</option>
            </select>
          </label>
          <label class="gr-pick">
            <select v-model="supRoom" class="gr-select" aria-label="القاعة">
              <option value="">كل القاعات</option>
              <option v-for="rm in supRooms" :key="rm" :value="rm">{{ rm }}</option>
            </select>
          </label>
        </div>
        <!-- نفس قالب سجل المجموعات: سلايدر + شريط الملخص الأخضر -->
        <SlideTable :rows="supSchedule" :size="5" :label="'المناقشات'">
          <template #default="{ rows: shown }">
          <div class="gr-table-wrap">
            <table class="gr-table">
              <thead><tr><th>التاريخ</th><th>الوقت</th><th>القاعة</th><th>المجموعة</th><th>المشرف</th><th>المناقش الأول</th><th>المناقش الثاني</th></tr></thead>
              <tbody>
                <tr v-for="r in shown" :key="r.id" class="is-link" @click="detail = plan.find((x) => x.id === r.id) || null">
                  <td><span class="mono">{{ r.date }}</span></td>
                  <td><span class="mono">{{ r.time }}</span></td>
                  <td>{{ r.room }}</td>
                  <td class="pt-strong">{{ r.section }}</td>
                  <td v-for="(pid, k) in [r.supId, ...r.examiners]" :key="k" :class="pid === supView && 'dp-me'">{{ pid ? supName(pid) : '—' }}</td>
                </tr>
                <tr v-if="!supSchedule.length"><td colspan="7" class="gr-empty">لا توجد مناقشات لهذا المشرف</td></tr>
              </tbody>
            </table>
          </div>
          </template>
          <template #after>
            <div class="gr-sumbar dp-sumbar">
              <span>عدد المناقشات: {{ supSchedule.length }}</span>
              <span>القاعات: {{ [...new Set(supSchedule.map((r) => r.room))].join('، ') }}</span>
              <span>الأيام: {{ [...new Set(supSchedule.map((r) => r.date))].length }}</span>
            </div>
          </template>
        </SlideTable>
      </template>
      <p v-else class="pt-muted">بعد توليد الجدول ومعالجة التعارضات اضغط "نشر للمشرفين" ليظهر لكل مشرف جدول مناقشاته ومواعيده.</p>
    </section>

    <!-- تفاصيل المناقشة -->
    <BaseModal :model-value="!!detail" :title="detail ? `مناقشة المجموعة ${detail.g.section}` : ''" :description="detail?.g.project || ''" size="lg" @update:model-value="!$event && (detail = null)">
      <div v-if="detail" class="dd">
        <div class="dd-tags">
          <span :class="['rv-pill', detail.status === 'confirmed' ? 'is-approved' : 'is-pending']">{{ detail.status === 'confirmed' ? 'منشورة' : 'بانتظار النشر' }}</span>
          <span :class="['rv-pill', conflicts[detail.id] ? 'is-rejected' : 'is-approved']">{{ conflicts[detail.id] ? `${conflicts[detail.id].length} تعارض` : 'بلا تعارض' }}</span>
          <span class="rv-pill">{{ DEGREES[detail.g.degree] }}</span>
          <span class="rv-pill">{{ detail.gender === 'female' ? 'طالبات' : 'طلاب' }}</span>
        </div>

        <div class="dd-when">
          <div><CalendarDays :size="18" /><span>التاريخ</span><b class="mono">{{ detail.date || '—' }}</b></div>
          <div><Clock :size="18" /><span>الوقت</span><b class="mono" dir="ltr">{{ detail.time ? `${detail.time} – ${fromMin(toMin(detail.time) + durOf(detail))}` : '—' }}</b></div>
          <div><DoorOpen :size="18" /><span>القاعة</span><b dir="ltr">{{ detail.room || '—' }}</b></div>
          <div><MapPin :size="18" /><span>المكان</span><b>{{ REGIONS[detail.region] }}</b></div>
        </div>

        <dl class="prd-kv dd-kv">
          <div><dt>المشرف</dt><dd>{{ supName(detail.g.supId) }}</dd></div>
          <div><dt>المناقش الأول</dt><dd>{{ detail.examiners[0] ? supName(detail.examiners[0]) : '—' }}</dd></div>
          <div><dt>المناقش الثاني</dt><dd>{{ detail.examiners[1] ? supName(detail.examiners[1]) : '—' }}</dd></div>
          <div><dt>التخصص</dt><dd>{{ detail.g.spec || '—' }}</dd></div>
          <div><dt>مدة المناقشة</dt><dd>{{ durOf(detail) }} دقيقة</dd></div>
          <div v-if="detail.note"><dt>ملاحظات</dt><dd>{{ detail.note }}</dd></div>
        </dl>

        <div>
          <h4 class="pr-h">الطلاب ({{ detail.g.members.length }})</h4>
          <ul class="rv-members">
            <li v-for="m in detail.g.members" :key="m.id"><span class="rv-avatar">{{ (m.name || '?').charAt(0) }}</span><span>{{ m.name }}</span></li>
          </ul>
        </div>

        <div v-if="conflicts[detail.id]" class="palert is-warning dd-conflicts">
          <b>التعارضات:</b>
          <ul><li v-for="(c, i) in conflicts[detail.id]" :key="i">{{ c }}</li></ul>
          <div class="dp-free">
            <span>الأوقات المتاحة في القاعات ({{ dayOf(detail) }}):</span>
            <button v-for="o in freeSlots(detail)" :key="o.room + o.time" type="button" class="dp-free-opt" @click="applySlot(detail, o)">
              <b dir="ltr">{{ o.time }}</b> <span dir="ltr">{{ o.room }}</span>
            </button>
            <em v-if="!freeSlots(detail).length">لا يوجد وقت متاح لكل الأطراف</em>
          </div>
        </div>
      </div>
      <template #footer>
        <button type="button" class="pbtn is-outline" @click="detail = null">إغلاق</button>
        <button type="button" class="pbtn is-cyan" @click="editDetail"><Pencil :size="16" /> تعديل في الجدول</button>
      </template>
    </BaseModal>

    <!-- معلومات المشرف (للقراءة) -->
    <BaseModal :model-value="!!supSel" :title="supSel ? supSel.name : ''" size="md" @update:model-value="!$event && (supSel = null)">
      <div v-if="supSel" class="pbm">
        <div class="pbm-stats">
          <div class="pbm-stat"><span>مجموعاته</span><b>{{ supStats.groups }}</b></div>
          <div class="pbm-stat"><span>يناقش</span><b>{{ supStats.examining }}</b></div>
        </div>
        <dl class="pbm-kv dp-supkv">
          <div><dt>التخصص</dt><dd>{{ supSel.spec || '—' }}</dd></div>
          <div v-if="supSel.employee_number"><dt>الرقم الوظيفي</dt><dd>{{ supSel.employee_number }}</dd></div>
          <div v-if="supSel.email"><dt>البريد الإلكتروني</dt><dd dir="ltr">{{ supSel.email }}</dd></div>
          <div v-if="supSel.whatsapp"><dt>واتساب</dt><dd dir="ltr">{{ supSel.whatsapp }}</dd></div>
        </dl>
      </div>
    </BaseModal>

    <!-- طباعة حسب القاعات: اختيار اليوم والقاعات قبل الطباعة -->
    <BaseModal v-model="roomPrint.open" title="طباعة جدول المناقشات حسب القاعات" size="md">
      <div class="dp-print">
        <div class="pfield">
          <span>اليوم</span>
          <nav class="hm-tabs">
            <button v-for="t in dayTabs" :key="t.value" type="button" :class="roomPrint.day === t.value && 'is-active'" @click="roomPrint.day = t.value">{{ t.label }}</button>
          </nav>
        </div>
        <div class="pfield">
          <span>القاعات ({{ roomPrint.rooms.length }} من {{ printableRooms.length }})</span>
          <label class="gp-check gp-bar">
            <input type="checkbox" :checked="roomPrint.rooms.length === printableRooms.length" @change="roomPrint.rooms = roomPrint.rooms.length === printableRooms.length ? [] : [...printableRooms]"> كل القاعات
          </label>
          <div class="dp-print-rooms">
            <label v-for="room in printableRooms" :key="room" :class="['gp-item', roomPrint.rooms.includes(room) && 'is-on']">
              <input v-model="roomPrint.rooms" type="checkbox" :value="room">
              <span class="gp-item-main"><b dir="ltr">{{ room }}</b><span class="pt-muted">{{ roomCount(room) }} مناقشة</span></span>
            </label>
          </div>
        </div>
        <div v-if="conflictCount" class="palert is-warning">في الجدول {{ conflictCount }} تعارض — ستُطبع المواعيد كما هي.</div>
      </div>
      <template #footer>
        <button type="button" class="pbtn is-outline" @click="roomPrint.open = false">إلغاء</button>
        <button type="button" class="pbtn is-cyan" :disabled="!roomPrint.rooms.length || busy" @click="wordRooms"><FileText :size="16" /> Word</button>
        <button type="button" class="pbtn is-green" :disabled="!roomPrint.rooms.length || busy" @click="printRooms"><Printer :size="16" /> {{ busy ? 'جارٍ التجهيز…' : `طباعة ${roomPrint.rooms.length} قاعة` }}</button>
      </template>
    </BaseModal>

    <!-- إضافة مناقش خارجي دائم (ليس مشرفًا ولا لجنة) — يبقى متاحًا في القوائم لاحقًا -->
    <BaseModal v-model="addEx.open" title="إضافة مناقش خارجي" description="يُضاف لقائمة المناقشين ويبقى متاحًا في المناقشات القادمة" size="md">
      <div class="dp-form">
        <label class="pfield"><span>الاسم <b class="as-req">*</b></span><input v-model.trim="addEx.name" type="text" placeholder="اسم المناقش" @keydown.enter.prevent="addExaminer"></label>
        <label class="pfield"><span>اللقب (اختياري)</span><input v-model.trim="addEx.title" type="text" placeholder="مثال: د."></label>
        <label class="pfield"><span>واتساب (اختياري)</span><input v-model.trim="addEx.whatsapp" type="tel" dir="ltr" placeholder="9705xxxxxxxx"></label>
      </div>
      <template #footer>
        <button type="button" class="pbtn is-outline" @click="addEx.open = false">إلغاء</button>
        <button type="button" class="pbtn is-green" :disabled="!addEx.name.trim() || addEx.saving" @click="addExaminer"><UserPlus :size="16" /> {{ addEx.saving ? 'جارٍ الإضافة…' : 'إضافة' }}</button>
      </template>
    </BaseModal>
  </div>
</template>

<script>
import SlideTable from '@/components/ui/SlideTable.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { CalendarPlus, Printer, FileSpreadsheet, FileText, Upload, Send, Save, Clock, CalendarDays, DoorOpen, X, AlertTriangle, List, LayoutGrid, MapPin, Pencil, ChevronDown, UserPlus, Users } from 'lucide-vue-next'
import { exportStyledExcel } from '@/utils/exportReport'
import { exportPlanPdf, exportRoomsPdf, exportDiscussionsDoc } from '@/utils/ucasReports'
import { DEGREES, REGIONS } from '@/utils/progressData'
import api from '@/services/api'
import { loadGroups, loadSupervisors, loadDiscussions, groupGender, groupRegion } from '@/services/adminData'
import { useExaminersStore } from '@/stores/examiners.store'

// معرّفات المناقشين داخل الجدول موحَّدة: المشرفون واللجنة بمعرّف المستخدم، والمناقش الخارجي
// بمعرّفه مزاحًا بهذا الأساس حتى لا يصطدم بمعرّف مستخدم. الهوية تُحفظ بالاسم في committee،
// وهذه المعرّفات لكشف التعارض والعرض فقط.
const EXTERNAL_BASE = 1_000_000

const toMin = (hhmm) => {
  const [h, m] = String(hhmm || '0:0').split(':').map(Number)
  return h * 60 + m
}
const pad = (n) => String(n).padStart(2, '0')
const fromMin = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`
const h12 = (m) => `${pad(Math.floor(m / 60) % 12 || 12)}:${pad(m % 60)}`
const CITY = { gaza: 'غزة', middle: 'وسط غزة', south: 'خانيونس' }

export default {
  name: 'DiscussionsTools',

  components: { SlideTable, BaseModal, CalendarPlus, Printer, FileSpreadsheet, FileText, Upload, Send, Save, Clock, CalendarDays, DoorOpen, X, AlertTriangle, List, LayoutGrid, MapPin, Pencil, ChevronDown, UserPlus, Users },

  data() {
    return {
      DEGREES, REGIONS,
      loading: true,
      saving: false,
      groups: [],
      supList: [],
      // أعضاء لجنة الإشراف + المناقشون الخارجيون (من /examiners/pool) — إضافةً للمشرفين في قائمة الاختيار
      examinerExtras: [],
      // نافذة إضافة مناقش خارجي دائم جديد
      addEx: { open: false, name: '', title: '', whatsapp: '', saving: false },
      // إعدادات التوليد: القسم المستهدف (فارغ = كل الأقسام) والمناقشون المتاحون للتوزيع التلقائي (معرّفاتهم)
      genDept: '',
      examinerPicks: [],
      s: {
        // مدة لكل درجة (نموذج الكلية: الدبلوم 15 دقيقة، البكالوريوس 30)
        durations: { diploma: 15, bachelor: 30 },
        // استراحة اختيارية من–إلى (لا مناقشات خلالها)
        breakOn: false, breakFrom: '12:30', breakTo: '13:00',
        // تقسيم الأيام = الجنس × الدرجة معًا (فئة لكل تقاطع): يوم خاص لكل من طالبات/طلاب مقسومًا على الدبلوم/البكالوريوس
        days: { 'female-diploma': '2027-01-24', 'female-bachelor': '2027-01-25', 'male-diploma': '2027-01-26', 'male-bachelor': '2027-01-27' },
        rooms: { gaza: ['E504', 'E506', 'E304'], middle: [], south: ['S101', 'S102'] },
        // ساعات كل قاعة (تُملأ افتراضيًا بساعات مكانها عند إضافتها)
        roomHours: {
          E504: { start: '09:00', end: '14:00' }, E506: { start: '09:00', end: '14:00' }, E304: { start: '09:00', end: '14:00' },
          S101: { start: '10:00', end: '13:00' }, S102: { start: '10:00', end: '13:00' }
        },
        // ساعات إلزامية لكل مكان تواجد
        windows: { gaza: { start: '09:00', end: '14:00' }, middle: { start: '09:00', end: '14:00' }, south: { start: '10:00', end: '13:00' } }
      },
      // الإعدادات مخفية طبيعيًا؛ نتذكّر اختيار المستخدم (فتح/طي) عبر التحديثات
      settingsOpen: (() => { try { return localStorage.getItem('dp-settings-open') === '1' } catch { return false } })(),
      detail: null,
      supSel: null,
      roomDraft: { gaza: '', middle: '', south: '' },
      view: 'list',
      onlyConflicts: false,
      roomPrint: { open: false, day: '', rooms: [] },
      plan: [],
      day: '',
      roomFilter: '',
      deptFilter: '',
      busy: false,
      published: null,
      supRoom: '',
      supView: null
    }
  },

  computed: {
    /** فئات الأيام = الجنس × الدرجة معًا (أربع فئات) */
    dayKeys() {
      return [
        { key: 'female-diploma', label: 'طالبات دبلوم' },
        { key: 'female-bachelor', label: 'طالبات بكالوريوس' },
        { key: 'male-diploma', label: 'طلاب دبلوم' },
        { key: 'male-bachelor', label: 'طلاب بكالوريوس' }
      ]
    },

    /** تبويبات فلتر اليوم: تواريخ فريدة (الفئات التي تشترك في تاريخ تُدمَج في تبويب واحد) */
    dayTabs() {
      const byDate = {}
      this.dayKeys.forEach((d) => {
        const date = this.s.days[d.key]
        if (!date) return
        ;(byDate[date] = byDate[date] || []).push(d.label)
      })
      // عنوان مختصر: فئة واحدة → اسمها والتاريخ، أكثر من فئة في نفس اليوم → التاريخ فقط (تفادي عنوان طويل)
      return [{ value: '', label: 'كل الأيام' }, ...Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, labels]) => ({ value: date, label: labels.length === 1 ? `${labels[0]} — ${date}` : date }))]
    },

    /** أماكن لها قاعات أو مجموعات وساعاتها ناقصة أو غير صحيحة (البداية بعد النهاية) — تمنع التوليد */
    badWindows() {
      return Object.keys(REGIONS).filter((k) => {
        const w = this.s.windows[k]
        const used = this.s.rooms[k].length || this.regionCount(k)
        return used && (!w.start || !w.end || toMin(w.start) >= toMin(w.end))
      })
    },

    roomTotal() {
      return Object.values(this.s.rooms).flat().length
    },

    allRooms() {
      return [...new Set(this.plan.map((r) => r.room).filter(Boolean))]
    },

    /** الأقسام الموجودة في المجموعات — لفلتر العرض حسب القسم */
    deptList() {
      return [...new Set((this.plan.length ? this.plan.map((r) => r.g.dept) : this.groups.map((g) => g.dept)).filter(Boolean))]
    },

    /** الأقسام من المجموعات — لاختيار قسم التوليد في الإعدادات (قبل وجود جدول) */
    allDepts() {
      return [...new Set(this.groups.map((g) => g.dept).filter(Boolean))]
    },

    /** كل المناقشين موحَّدين (مشرفون + لجنة + خارجيون) لقائمة الاختيار وتوزيع التوليد */
    examinerAll() {
      return [...this.supList.map((s) => ({ id: s.id, name: s.name, group: 'supervisor' })), ...this.examinerExtras]
    },

    /** مجموعة معرّفات المناقشين المحدَّدين للتوليد (بحث سريع) */
    pickedSet() {
      return new Set(this.examinerPicks)
    },

    /** قائمة اختيار المناقشين مجمَّعة: المشرفون ← لجنة الإشراف ← المناقشون الخارجيون */
    examinerOptions() {
      return [
        { label: 'المشرفون', items: this.supList.map((s) => ({ id: s.id, name: s.name })) },
        { label: 'لجنة الإشراف', items: this.examinerExtras.filter((e) => e.group === 'committee') },
        { label: 'مناقشون خارجيون', items: this.examinerExtras.filter((e) => e.group === 'external') }
      ].filter((g) => g.items.length)
    },

    /** معرّف → اسم لكل المناقشين (مشرفون + لجنة + خارجيون) لعرض الأسماء في كل مكان */
    nameById() {
      const m = new Map()
      this.supList.forEach((s) => m.set(s.id, s.name))
      this.examinerExtras.forEach((e) => m.set(e.id, e.name))
      return m
    },

    /** اسم → معرّف لاسترجاع المناقشين المحفوظين بالاسم (committee) إلى معرّفاتهم */
    idByName() {
      const m = new Map()
      this.supList.forEach((s) => m.set(s.name, s.id))
      this.examinerExtras.forEach((e) => m.set(e.name, e.id))
      return m
    },

    visiblePlan() {
      return this.plan.filter((r) => (!this.day || r.date === this.day) && (!this.roomFilter || r.room === this.roomFilter) && (!this.deptFilter || r.g.dept === this.deptFilter) && (!this.onlyConflicts || this.conflicts[r.id]))
    },

    kpis() {
      const done = this.plan.filter((r) => r.time && r.room).length
      return [
        { label: 'مناقشة', value: this.plan.length },
        { label: 'مجدولة', value: done, tone: 'is-good' },
        { label: 'بلا موعد', value: this.plan.length - done, tone: this.plan.length - done ? 'is-bad' : '' },
        { label: 'فيها تعارض', value: this.conflictCount, tone: this.conflictCount ? 'is-warn' : '' },
        { label: 'قاعة مستخدمة', value: this.allRooms.length }
      ]
    },

    /** إحصاء المشرف المختار في بطاقته: عدد مجموعاته وعدد المناقشات التي يناقش فيها */
    supStats() {
      if (!this.supSel) return { groups: 0, examining: 0 }
      const id = this.supSel.id
      return {
        groups: this.groups.filter((g) => g.supId === id).length,
        examining: this.plan.filter((r) => r.examiners.includes(id)).length
      }
    },

    /** الاستراحة بالدقائق [من، إلى]، أو null إن لم تُفعَّل أو كانت غير صحيحة */
    breakRange() {
      const a = toMin(this.s.breakFrom)
      const b = toMin(this.s.breakTo)
      return this.s.breakOn && this.s.breakFrom && this.s.breakTo && b > a ? [a, b] : null
    },

    /**
     * سعة كل يوم بالدقائق: (امتداد ساعات الأماكن المستخدمة − الاستراحة) × المناقشات المتزامنة، مقابل مجموع مدد مجموعاته
     * المتزامن = أقل من (المشرفين ÷ 3: المشرف + مناقشان) و(عدد القاعات)
     */
    capacity() {
      const used = Object.keys(REGIONS).filter((k) => this.s.rooms[k].length || this.regionCount(k)).map(this.windowOf).filter(([a, b]) => b > a)
      const from = Math.min(...used.map(([a]) => a))
      const to = Math.max(...used.map(([, b]) => b))
      const br = this.breakRange
      const minutes = used.length ? to - from - (br ? Math.max(0, Math.min(to, br[1]) - Math.max(from, br[0])) : 0) : 0
      const bySups = Math.floor(this.supList.length / 3)
      const parallel = Math.min(this.roomTotal, bySups)
      const rows = this.plan.length ? this.plan : this.groups.map((g) => ({ g, gender: groupGender(g) }))
      return this.dayKeys.map(({ key, label }) => {
        const mine = rows.filter((r) => this.dayKeyOf(r) === key)
        const need = mine.reduce((n, r) => n + this.durOf(r), 0)
        const have = Math.max(0, minutes) * parallel
        return { key, label, date: this.s.days[key], groups: mine.length, need, have, ok: need <= have }
      }).filter((c) => c.groups > 0)
    },

    /** ملخص التعارضات حسب النوع */
    issueSummary() {
      const all = Object.values(this.conflicts).flat()
      const n = (re) => all.filter((m) => re.test(m)).length
      return [
        { label: 'بلا موعد أو قاعة', count: n(/لم يُحدَّد/) },
        { label: 'تعارض مشرف أو مناقش', count: n(/مرتبط بمناقشة|المشرف لا يناقش|نفس الشخص|يلزم مناقشان/) },
        { label: 'قاعة محجوزة', count: n(/محجوزة/) },
        { label: 'يوم غير مطابق', count: n(/يجب أن يكون يوم/) },
        { label: 'خارج ساعات المكان أو القاعة', count: n(/خارج ساعات/) },
        { label: 'داخل الاستراحة', count: n(/الاستراحة/) }
      ].filter((x) => x.count)
    },

    /** شبكة القاعات: اليوم المختار (أو يوم الطالبات افتراضيًا) */
    gridDay() {
      return this.day || this.s.days[this.dayKeys[0].key]
    },
    gridRows() {
      return this.plan.filter((r) => r.date === this.gridDay && (!this.deptFilter || r.g.dept === this.deptFilter))
    },
    gridRooms() {
      const used = this.gridRows.map((r) => r.room).filter(Boolean)
      const regions = new Set(this.gridRows.map((r) => r.region))
      const configured = [...regions].flatMap((k) => this.roomsOf(k))
      return [...new Set([...configured, ...used])]
    },
    gridTimes() {
      return [...new Set(this.gridRows.map((r) => r.time).filter(Boolean))].sort()
    },
    unscheduled() {
      return this.gridRows.filter((r) => !r.time || !r.room)
    },

    /** القاعات التي فيها مناقشات في اليوم المختار للطباعة */
    printableRooms() {
      return [...new Set(this.plan.filter((r) => r.time && r.room && (!this.roomPrint.day || r.date === this.roomPrint.day)).map((r) => r.room))].sort()
    },

    /** التعارضات لكل صف: { rowId: [رسائل] } */
    conflicts() {
      const out = {}
      const add = (r, msg) => (out[r.id] = [...(out[r.id] || []), msg])
      const overlap = (x, y) => x.date === y.date && toMin(x.time) < toMin(y.time) + this.durOf(y) && toMin(y.time) < toMin(x.time) + this.durOf(x)
      const people = new Map()
      const rooms = new Map()
      this.plan.forEach((r) => {
        if (!r.date || !r.time || !r.room) return add(r, 'لم يُحدَّد له موعد أو قاعة')
        const [a, b] = r.examiners
        if (!a || !b) add(r, 'يلزم مناقشان')
        if (a && a === b) add(r, 'المناقشان نفس الشخص')
        if (r.examiners.includes(r.g.supId)) add(r, 'المشرف لا يناقش مجموعته')
        const expected = this.dayOf(r)
        if (r.date !== expected) add(r, `موعد ${this.dayLabelOf(r)} يجب أن يكون يوم ${expected}`)
        const [ws, we] = this.windowOf(r.region)
        if (toMin(r.time) < ws || toMin(r.time) + this.durOf(r) > we) add(r, `خارج ساعات ${REGIONS[r.region]} (${fromMin(ws)}–${fromMin(we)})`)
        if (r.room && this.roomHoursOk(r.room) && !this.roomFits(r.room, r.region, toMin(r.time), toMin(r.time) + this.durOf(r))) {
          add(r, `خارج ساعات القاعة ${r.room} (${this.roomHoursLabel(r.room, r.region)})`)
        }
        const br = this.breakRange
        if (br && toMin(r.time) < br[1] && br[0] < toMin(r.time) + this.durOf(r)) add(r, `يتداخل مع الاستراحة (${fromMin(br[0])}–${fromMin(br[1])})`)
        // كل شخص (مشرف المجموعة + المناقشون) في مكان واحد بفترات غير متداخلة — ولو بقاعتين مختلفتين
        ;[r.g.supId, a, b].filter(Boolean).forEach((pid) => {
          const list = people.get(pid) || []
          list.forEach((o) => {
            if (overlap(o, r)) {
              add(r, `${this.supName(pid)} مرتبط بمناقشة أخرى بنفس الوقت (شعبة ${o.g.section})`)
              add(o, `${this.supName(pid)} مرتبط بمناقشة أخرى بنفس الوقت (شعبة ${r.g.section})`)
            }
          })
          people.set(pid, [...list, r])
        })
        const list = rooms.get(`${r.date}|${r.room}`) || []
        list.forEach((o) => {
          if (overlap(o, r)) {
            add(r, `القاعة ${r.room} محجوزة لشعبة ${o.g.section}`)
            add(o, `القاعة ${r.room} محجوزة لشعبة ${r.g.section}`)
          }
        })
        rooms.set(`${r.date}|${r.room}`, [...list, r])
      })
      Object.keys(out).forEach((k) => (out[k] = [...new Set(out[k])]))
      return out
    },

    conflictCount() {
      return Object.keys(this.conflicts).length
    },

    conflictList() {
      return this.plan.flatMap((r) => (this.conflicts[r.id] || []).map((msg) => ({ section: r.g.section, msg })))
    },

    supSchedule() {
      if (!this.published) return []
      const id = this.supView
      return this.published.rows
        .filter((r) => (r.supId === id || r.examiners.includes(id)) && (!this.supRoom || r.room === this.supRoom))
        .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
    },
    /** قاعات مناقشات المشرف المختار (لفلتر القاعة) */
    supRooms() {
      if (!this.published) return []
      const id = this.supView
      return [...new Set(this.published.rows.filter((r) => r.supId === id || r.examiners.includes(id)).map((r) => r.room).filter(Boolean))].sort()
    }
  },

  async created() {
    try {
      // المناقشة تُسجَّل على مشروع، فالمجموعات بلا مشروع لا تدخل الجدول
      this.groups = (await loadGroups()).filter((g) => g.projectId)
    } catch {
      this.$toast?.error('تعذّر تحميل المجموعات')
    }
    this.supList = await loadSupervisors(this.groups)
    this.supView = this.supList[0]?.id ?? null
    // افتراضيًا كل المشرفين متاحون كمناقشين (اللجنة والخارجيون اختياريون يُفعَّلون بالشيك بوكس)
    this.examinerPicks = this.supList.map((s) => s.id)
    await this.loadExaminerPool()
    try {
      this.fromDiscussions(await loadDiscussions())
    } catch {
      // لا مواعيد محفوظة بعد
    }
    this.loading = false
  },

  watch: {
    // تذكّر حالة لوحة الإعدادات (مفتوحة/مطوية) بين التحديثات
    settingsOpen(open) {
      try { localStorage.setItem('dp-settings-open', open ? '1' : '0') } catch { /* تجاهل */ }
    }
  },

  methods: {
    toMin,
    fromMin,

    /**
     * الأوقات المتاحة لمناقشة: في يومها الصحيح وضمن ساعات مكانها، في قاعات مكانها، بحيث تكون القاعة فارغة
     * والمشرف والمناقشان (إن حُدّدا) غير مرتبطين بمناقشة متداخلة — أول 6 خيارات
     */
    freeSlots(row) {
      const date = this.dayOf(row)
      const dur = this.durOf(row)
      const others = this.plan.filter((o) => o !== row && o.date === date && o.time)
      const busy = (a, b, test) => others.some((o) => test(o) && a < toMin(o.time) + this.durOf(o) && toMin(o.time) < b)
      const people = [row.g.supId, ...row.examiners].filter(Boolean)
      const out = []
      for (const a of this.startsFor(row.region, dur)) {
        const b = a + dur
        if (busy(a, b, (o) => people.some((pid) => o.g.supId === pid || o.examiners.includes(pid)))) continue
        for (const room of this.roomsOf(row.region)) {
          if (this.roomFits(room, row.region, a, b) && !busy(a, b, (o) => o.room === room)) out.push({ time: fromMin(a), room, date })
          if (out.length >= 6) return out
        }
      }
      return out
    },

    applySlot(row, o) {
      Object.assign(row, { date: o.date, time: o.time, room: o.room })
      this.$toast?.success(`نُقلت مناقشة ${row.g.section} إلى ${o.room} الساعة ${o.time}`)
    },

    /** من النافذة إلى صف المجموعة في قائمة الخطوة 2 */
    editDetail() {
      const id = this.detail.id
      Object.assign(this, { detail: null, view: 'list', day: '', roomFilter: '', onlyConflicts: false })
      this.$nextTick(() => document.querySelector(`[data-row="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
    },

    supName(id) {
      return this.nameById.get(id) || '—'
    },

    /** يجلب لجنة الإشراف والمناقشين الخارجيين لإضافتهم لقائمة الاختيار (لجنة الإشراف فقط لها الصلاحية؛ يتجاهل الفشل بهدوء) */
    async loadExaminerPool() {
      try {
        const pool = await useExaminersStore().fetchExaminerPool()
        this.examinerExtras = [
          ...(pool.committee || []).map((c) => ({ id: c.user_id, name: c.name, group: 'committee' })),
          ...(pool.externals || []).map((e) => ({ id: EXTERNAL_BASE + e.examiner_id, name: e.name, group: 'external' }))
        ]
      } catch {
        // لا صلاحية (غير لجنة الإشراف) أو لا مناقشين إضافيين — تبقى القائمة على المشرفين فقط
      }
    },

    /** إضافة مناقش خارجي دائم جديد ثم إتاحته فورًا في القوائم */
    async addExaminer() {
      const name = this.addEx.name.trim()
      if (!name) return
      this.addEx.saving = true
      try {
        const title = this.addEx.title.trim()
        const ex = await useExaminersStore().createExaminer({ name, title: title || null, whatsapp: this.addEx.whatsapp.trim() || null })
        const display = (ex.title ? `${ex.title} ` : '') + ex.name
        this.examinerExtras = [...this.examinerExtras, { id: EXTERNAL_BASE + ex.id, name: display, group: 'external' }]
        this.$toast?.success(`أُضيف المناقش ${display}`)
        this.addEx = { open: false, name: '', title: '', whatsapp: '', saving: false }
      } catch {
        this.$toast?.error('تعذّر إضافة المناقش — تحقّق من الاسم ورقم الواتساب')
        this.addEx.saving = false
      }
    },

    /** بطاقة معلومات المشرف */
    openSup(id) {
      this.supSel = this.supList.find((x) => x.id === id) || null
    },

    roomsOf(region) {
      return this.s.rooms[region] || []
    },

    /** مفتاح فئة الصف = الجنس-الدرجة */
    dayKeyOf(row) {
      return `${row.gender}-${row.g.degree}`
    },

    dayOf(row) {
      return this.s.days[this.dayKeyOf(row)]
    },

    dayLabelOf(row) {
      return this.dayKeys.find((d) => d.key === this.dayKeyOf(row))?.label || ''
    },

    /** مدة مناقشة المجموعة: المدة المحفوظة مع الموعد أولًا (تطابق ما يفحصه الخادم)، وإلا حسب درجتها */
    durOf(row) {
      if (row && Number(row.duration) > 0) return Number(row.duration)
      return Math.max(5, Number(this.s.durations[row.g.degree]) || 30)
    },

    /** ساعات مكان التواجد الإلزامية بالدقائق */
    windowOf(region) {
      const w = this.s.windows[region] || {}
      return [toMin(w.start), toMin(w.end)]
    },

    roomHoursOk(room) {
      const h = this.s.roomHours[room]
      return !!h?.start && !!h?.end && toMin(h.start) < toMin(h.end)
    },

    /** النافذة الفعلية لقاعة = تقاطع ساعات القاعة مع ساعات مكانها */
    roomWindow(room, region) {
      const [ws, we] = this.windowOf(region)
      if (!this.roomHoursOk(room)) return [ws, we]
      const h = this.s.roomHours[room]
      return [Math.max(ws, toMin(h.start)), Math.min(we, toMin(h.end))]
    },

    roomFits(room, region, a, b) {
      const [rs, re] = this.roomWindow(room, region)
      return a >= rs && b <= re
    },

    roomHoursLabel(room, region) {
      const [a, b] = this.roomWindow(room, region)
      return `${fromMin(a)}–${fromMin(b)}`
    },

    regionCount(region) {
      return (this.plan.length ? this.plan.filter((r) => r.region === region) : this.groups.filter((g) => groupRegion(g) === region)).length
    },

    /** إضافة قاعة كرقاقة (Enter أو فاصلة) — تقبل لصق عدة قاعات مفصولة بفواصل */
    addRoom(region) {
      const names = String(this.roomDraft[region] || '').split(/[،,]/).map((x) => x.trim()).filter(Boolean)
      if (names.length) this.s.rooms[region] = [...new Set([...this.s.rooms[region], ...names])]
      names.forEach((n) => { if (!this.s.roomHours[n]) this.s.roomHours[n] = { ...this.s.windows[region] } })
      this.roomDraft[region] = ''
    },

    removeRoom(region, room) {
      this.s.rooms[region] = this.s.rooms[region].filter((x) => x !== room)
    },

    /** هل الشخص مرتبط بمناقشة أخرى تتقاطع مع موعد هذا الصف؟ (لتمييزه في قائمة المناقشين) */
    isBusy(pid, row) {
      if (!row.date || !row.time) return false
      const a = toMin(row.time)
      return this.plan.some((o) => o !== row && o.date === row.date && o.time && (o.g.supId === pid || o.examiners.includes(pid)) && a < toMin(o.time) + this.durOf(o) && toMin(o.time) < a + this.durOf(row))
    },

    cell(time, room) {
      return this.gridRows.filter((r) => r.time === time && r.room === room)
    },

    roomCount(room) {
      return this.plan.filter((r) => r.room === room && r.time && (!this.roomPrint.day || r.date === this.roomPrint.day)).length
    },

    openRoomPrint() {
      this.roomPrint.day = this.day
      this.roomPrint.open = true
      this.$nextTick(() => (this.roomPrint.rooms = [...this.printableRooms]))
    },

    /** بدايات المناقشة الممكنة لمدة معيّنة ضمن ساعات المكان مع تخطّي الاستراحة */
    startsFor(region, dur) {
      const [from, end] = this.windowOf(region)
      const [bFrom, bTo] = this.breakRange || [0, 0]
      const out = []
      let t = from
      while (t + dur <= end) {
        if (bTo > bFrom && t < bTo && t + dur > bFrom) {
          t = bTo
          continue
        }
        out.push(t)
        t += dur
      }
      return out
    },

    /**
     * توليد جشِع بفترات متغيرة المدة (الدبلوم ≠ البكالوريوس): المجموعات مرتبة بالدرجة ثم رقم الشعبة،
     * ولكل مجموعة أول بداية ضمن ساعات مكانها تكون فيها قاعة من قاعات مكانها فارغة، ومشرفها متاحًا، ومناقشان متاحان ليسا مشرفيها
     * (يُفضَّل أقل المناقشين تحميلًا) — ponytail: جشِع بلا تراجع؛ يكفي لعشرات المجموعات، ويُستبدل بحلّال قيود إن كبر العدد
     */
    generate() {
      if (this.badWindows.length) return this.$toast?.error(`ساعات المكان إلزامية — حدّدها لـ ${this.badWindows.map((k) => REGIONS[k]).join('، ')}`)
      // قائمة المناقشين المتاحين = المحدَّدون بالشيك بوكس (مشرفون + لجنة + خارجيون)
      const picked = this.examinerAll.filter((e) => this.pickedSet.has(e.id))
      if (picked.length < 2) return this.$toast?.error('اختر مناقشَين على الأقل من قائمة «من يناقش؟»')
      // القسم المستهدف للتوليد؛ باقي الأقسام تبقى كما هي ولا تُلمَس
      const scope = this.genDept
      const inScope = (g) => !scope || g.dept === scope
      if (!this.groups.some(inScope)) return this.$toast?.error('لا مجموعات في القسم المختار')
      // لا يمكن توليد جدول بلا قاعات مطلقًا
      if (!this.roomTotal) return this.$toast?.error('أضف قاعة واحدة على الأقل في أحد الأماكن قبل التوليد')
      // لكل مجموعة يلزم مناقشان غير مشرفها؛ تأكّد أن المحدَّدين يكفون لأقسى حالة (مشرف ضمن القائمة)
      const scopeSups = [...new Set(this.groups.filter(inScope).map((g) => g.supId))]
      if (scopeSups.some((sid) => picked.filter((x) => x.id !== sid).length < 2)) {
        return this.$toast?.error('عدد المناقشين المحدَّدين لا يكفي — يلزم مناقشان لكل مجموعة غير مشرفها. أضف مناقشًا آخر من «من يناقش؟»')
      }

      const busy = new Map() // `${date}|${personId أو room:اسم}` → [[بداية، نهاية]]
      const free = (key, a, b) => !(busy.get(key) || []).some(([x, y]) => a < y && x < b)
      const take = (key, a, b) => busy.set(key, [...(busy.get(key) || []), [a, b]])
      const load = Object.fromEntries(picked.map((x) => [x.id, 0]))
      // الأماكن التي لها قاعات (البديل حين يكون مكان المجموعة بلا قاعات)، مع حِمل لتوزيع البديل بعدالة
      const withRooms = Object.keys(REGIONS).filter((k) => this.roomsOf(k).length)
      const regionLoad = Object.fromEntries(withRooms.map((k) => [k, 0]))
      let reassigned = 0
      // حجز مواعيد الأقسام غير المستهدفة المجدولة مسبقًا حتى لا يتعارض التوليد معها، وموازنة الحِمل عادلة
      this.plan.forEach((r) => {
        if (inScope(r.g) || !r.time || !r.room) return
        const a = toMin(r.time), b = a + this.durOf(r)
        ;[r.g.supId, ...r.examiners].filter(Boolean).forEach((pid) => take(`${r.date}|${pid}`, a, b))
        take(`${r.date}|room:${r.room}`, a, b)
        r.examiners.filter(Boolean).forEach((id) => { if (id in load) load[id] += 1 })
        if (r.region in regionLoad) regionLoad[r.region] += 1
      })

      // جدولة مجموعة واحدة في أول موعد/قاعة/مناقشَين متاحين، مع حجزها بخريطة الـ busy المشتركة
      const placeGroup = (g) => {
        // إعادة التوليد تحتفظ بالفئة والمكان المعدّلين يدويًا وبمعرّف الموعد المحفوظ (تحديث بدل تكرار)
        const prev = this.plan.find((p) => p.id === g.id)
        // مكان المجموعة الطبيعي؛ فإن كان بلا قاعات نحوّلها لأقل الأماكن (ذات القاعات) حِملًا — فلا تبقى بلا موعد
        const natural = prev?.region || groupRegion(g)
        let region = natural
        if (!this.roomsOf(region).length) {
          region = withRooms.reduce((best, k) => (regionLoad[k] < regionLoad[best] ? k : best), withRooms[0])
          reassigned += 1
        }
        regionLoad[region] = (regionLoad[region] || 0) + 1
        const row = { id: g.id, g, gender: prev?.gender || groupGender(g), region, time: '', room: '', examiners: [null, null], note: '', discussionId: prev?.discussionId ?? null }
        row.date = this.dayOf(row)
        const dur = this.durOf(row)
        const d = row.date
        for (const a of this.startsFor(row.region, dur)) {
          const b = a + dur
          if (!free(`${d}|${g.supId}`, a, b)) continue
          const room = this.roomsOf(row.region).find((rm) => this.roomFits(rm, row.region, a, b) && free(`${d}|room:${rm}`, a, b))
          // قاعدة التوليد: المناقش لا يناقش شعبته (x.id !== g.supId)، ويُفضَّل أقل المناقشين تحميلًا
          const ex = picked.filter((x) => x.id !== g.supId && free(`${d}|${x.id}`, a, b)).sort((x, y) => load[x.id] - load[y.id]).slice(0, 2).map((x) => x.id)
          if (!room || ex.length < 2) continue
          ;[g.supId, ...ex].forEach((pid) => take(`${d}|${pid}`, a, b))
          take(`${d}|room:${room}`, a, b)
          ex.forEach((id) => (load[id] += 1))
          Object.assign(row, { time: fromMin(a), room, examiners: ex })
          break
        }
        return row
      }

      const inScopeGroups = this.groups.filter(inScope)
      const bySection = (a, b) => a.degree.localeCompare(b.degree) || a.section.localeCompare(b.section, 'en', { numeric: true })
      // نولّد كل قسم على حدة بالتتابع (قسم واحد عند تحديده، وإلا كل الأقسام): كل قسم يحجز مواعيده
      // في نفس خريطة الـ busy فيتجنّبها القسم التالي — فلا تداخل بين الأقسام وكل جدول مستقل عن الآخر.
      const deptOrder = [...new Set(inScopeGroups.map((g) => g.dept || ''))]
      const newRows = []
      for (const dept of deptOrder) {
        for (const g of inScopeGroups.filter((g) => (g.dept || '') === dept).sort(bySection)) {
          newRows.push(placeGroup(g))
        }
      }

      // تمريرة ضمان: أي مجموعة تعذّر جدولتها ضمن ساعات مكانها نضمن لها موعدًا بتمديد ساعات المكان
      // (وقاعاته) لآخر اليوم — فترات فاضية الكل متفرّغ فيها — بحيث لا يبقى أحد بلا موعد ولا يحدث تداخل.
      const extendedRegions = new Set()
      let unschedulable = 0
      for (const u of newRows.filter((r) => !r.time)) {
        // يتعذّر الضمان فقط إن لم يكن للمكان قاعات، أو لا يوجد مناقشان متاحان غير مشرف المجموعة
        if (!this.roomsOf(u.region).length || picked.filter((x) => x.id !== u.g.supId).length < 2) { unschedulable += 1; continue }
        const d = u.date
        const dur = this.durOf(u)
        for (let guard = 0; !u.time && guard < 300; guard += 1) {
          for (const a of this.startsFor(u.region, dur)) {
            const b = a + dur
            if (!free(`${d}|${u.g.supId}`, a, b)) continue
            const room = this.roomsOf(u.region).find((rm) => this.roomFits(rm, u.region, a, b) && free(`${d}|room:${rm}`, a, b))
            const ex = picked.filter((x) => x.id !== u.g.supId && free(`${d}|${x.id}`, a, b)).sort((x, y) => load[x.id] - load[y.id]).slice(0, 2).map((x) => x.id)
            if (!room || ex.length < 2) continue
            ;[u.g.supId, ...ex].forEach((pid) => take(`${d}|${pid}`, a, b))
            take(`${d}|room:${room}`, a, b)
            ex.forEach((id) => (load[id] += 1))
            Object.assign(u, { time: fromMin(a), room, examiners: ex })
            break
          }
          if (!u.time) {
            // مدّد نهاية ساعات المكان وقاعاته بمقدار مدة مناقشة لإتاحة فترة جديدة فاضية
            const w = this.s.windows[u.region]
            const newEnd = toMin(w.end) + dur
            w.end = fromMin(newEnd)
            this.roomsOf(u.region).forEach((rm) => { const h = this.s.roomHours[rm]; if (h && toMin(h.end) < newEnd) h.end = fromMin(newEnd) })
            extendedRegions.add(u.region)
          }
        }
      }

      // دمج: نُبقي صفوف الأقسام غير المستهدفة كما هي، ونستبدل المستهدفة بالجديدة، ثم ترتيب يُجمِّع كل قسم معًا
      const kept = this.plan.filter((r) => !inScope(r.g))
      this.plan = [...kept, ...newRows].sort((a, b) => (a.g.dept || '').localeCompare(b.g.dept || '', 'ar') || bySection(a.g, b.g))
      this.deptFilter = scope
      this.published = null
      this.settingsOpen = false
      this.$nextTick(() => document.getElementById('dp-table')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
      const moved = reassigned ? ` ونُقلت ${reassigned} مجموعة إلى أماكن فيها قاعات` : ''
      if (unschedulable) {
        this.$toast?.error(`تعذّرت جدولة ${unschedulable} مجموعة — مكانها بلا قاعات أو لا يتوفّر مناقشان لها`)
      } else if (extendedRegions.size) {
        this.$toast?.success(`جُدولت ${newRows.length} مناقشة بلا تعارضات${moved} — مُدِّدت ساعات ${[...extendedRegions].map((k) => REGIONS[k]).join('، ')} لاستيعاب الجميع`)
      } else {
        this.$toast?.success(`جُدولت ${newRows.length} مناقشة بلا تعارضات${moved}`)
      }
    },

    /** تحديد/إلغاء كل المناقشين في قائمة «من يناقش؟» */
    toggleAllExaminers() {
      const all = this.examinerAll.map((e) => e.id)
      this.examinerPicks = this.examinerPicks.length >= all.length ? [] : all
    },

    pdfRows() {
      return this.plan.filter((r) => r.time).map((r) => ({
        section: r.g.section,
        sup: this.supName(r.g.supId),
        members: r.g.members,
        date: r.date,
        // start = الوقت بصيغة 24 ساعة للترتيب؛ time للعرض بصيغة 12 ساعة مع ص/م
        start: r.time,
        time: `${h12(toMin(r.time))} – ${h12(toMin(r.time) + this.durOf(r))} ${toMin(r.time) + this.durOf(r) >= 720 ? 'م' : 'ص'}`,
        room: r.room,
        city: CITY[r.region],
        examiners: r.examiners.filter(Boolean).map(this.supName),
        note: r.note,
        degree: r.g.degree,
        spec: r.g.spec
      }))
    },

    async printPlan() {
      this.busy = true
      try {
        await exportPlanPdf(this.pdfRows())
      } finally {
        this.busy = false
      }
    },

    /** تصدير Word للجدول كاملًا (صفحة لكل يوم × درجة كنموذج الكلية) */
    downloadWord() {
      exportDiscussionsDoc(this.pdfRows())
    },

    /** تصدير Word حسب القاعات المختارة في نافذة الطباعة */
    wordRooms() {
      const { day, rooms } = this.roomPrint
      exportDiscussionsDoc(this.pdfRows().filter((r) => rooms.includes(r.room) && (!day || r.date === day)), { byRoom: true })
      this.roomPrint.open = false
    },

    async printRooms() {
      const { day, rooms } = this.roomPrint
      this.busy = true
      try {
        await exportRoomsPdf(this.pdfRows().filter((r) => rooms.includes(r.room) && (!day || r.date === day)))
        this.roomPrint.open = false
      } finally {
        this.busy = false
      }
    },

    async downloadExcel() {
      this.busy = true
      try {
        await exportStyledExcel({
          fileName: 'جدول-المناقشات.xlsx',
          sheetTitle: 'جدول المناقشات',
          columns: [
            { key: 'section', label: 'الشعبة', width: 12 },
            { key: 'sup', label: 'المشرف', width: 24 },
            { key: 'date', label: 'التاريخ', width: 14 },
            { key: 'time', label: 'الوقت', width: 10 },
            { key: 'room', label: 'القاعة', width: 10 },
            { key: 'ex1', label: 'المناقش الأول', width: 24 },
            { key: 'ex2', label: 'المناقش الثاني', width: 24 },
            { key: 'note', label: 'ملاحظات', width: 24 }
          ],
          rowGroups: this.plan.map((r) => [{
            section: r.g.section, sup: this.supName(r.g.supId), date: r.date, time: r.time, room: r.room,
            ex1: this.supName(r.examiners[0]), ex2: this.supName(r.examiners[1]), note: r.note
          }])
        })
      } finally {
        this.busy = false
      }
    },

    /** إعادة رفع ملف Excel بعد تعديله: يُطابَق كل صف برقم الشعبة وتُحدَّث الحقول ثم يُعاد فحص التعارضات */
    async reupload(ev) {
      const file = ev.target.files[0]
      ev.target.value = ''
      if (!file) return
      try {
        const { default: ExcelJS } = await import('exceljs')
        const wb = new ExcelJS.Workbook()
        await wb.xlsx.load(await file.arrayBuffer())
        const ws = wb.worksheets[0]
        const col = {}
        ws.getRow(1).eachCell((c, i) => (col[String(c.value).trim()] = i))
        const text = (row, label) => {
          const v = row.getCell(col[label]).value
          if (v instanceof Date) return v.toISOString().slice(0, 10)
          return String(v?.text ?? v ?? '').trim()
        }
        const byName = (n) => this.idByName.get(n) ?? null
        let updated = 0
        ws.eachRow((row, i) => {
          if (i === 1) return
          const r = this.plan.find((p) => p.g.section === text(row, 'الشعبة'))
          if (!r) return
          Object.assign(r, {
            date: text(row, 'التاريخ') || r.date,
            time: text(row, 'الوقت').slice(0, 5) || r.time,
            room: text(row, 'القاعة') || r.room,
            examiners: [byName(text(row, 'المناقش الأول')), byName(text(row, 'المناقش الثاني'))],
            note: text(row, 'ملاحظات')
          })
          updated += 1
        })
        this.published = null
        this.$toast?.success(`حُدّث ${updated} موعدًا من الملف${this.conflictCount ? ` — ${this.conflictCount} تعارض يحتاج معالجة` : ''}`)
      } catch {
        this.$toast?.error('تعذّر قراءة الملف — استخدم ملف "تنزيل Excel" نفسه بعد تعديله')
      }
    },

    /** يحفظ صفوف الجدول في الخادم: PUT للموجود و POST للجديد (لجنة المناقشة = أسماء المناقشَين) */
    async save(status) {
      this.saving = true
      let ok = 0
      const rows = this.plan.filter((r) => r.time && r.room)
      for (const r of rows) {
        const body = {
          place: r.room,
          discussion_date: r.date,
          discussion_time: r.time,
          // نحفظ المدة بالدقائق ليعرفها الخادم ويفحص تداخل الفترات (بدلها كان يُعاد احتسابها من الإعدادات عند التحميل فتظهر تداخلات وهمية)
          duration: this.durOf(r),
          // لجنة المناقشة = أسماء المناقشَين، والملاحظة بعد " | " (لا يوجد عمود ملاحظات في الخادم)
          committee: [r.examiners.filter(Boolean).map(this.supName).join('، '), r.note].filter(Boolean).join(' | ') || '—',
          status
        }
        try {
          if (r.discussionId) {
            await api.put(`/discussions/${r.discussionId}`, body)
          } else {
            const { data } = await api.post('/discussions', { ...body, project_id: r.g.projectId, supervisor_id: r.g.supId })
            r.discussionId = data.id
          }
          r.status = status
          ok += 1
        } catch {
          // يُحسب ضمن غير المحفوظ
        }
      }
      this.saving = false
      return { ok, total: rows.length }
    },

    async saveDraft() {
      const { ok, total } = await this.save('pending')
      this.$toast?.[ok === total ? 'success' : 'error'](`حُفظ ${ok} من ${total} موعدًا (بانتظار النشر)`)
    },

    /** النشر = حفظ كل المواعيد كمؤكَّدة، فيصل لكل مشرف وطلابه موعدهم من الخادم */
    async publish() {
      if (this.conflictCount) return
      const { ok, total } = await this.save('confirmed')
      this.snapshot()
      this.$toast?.[ok === total ? 'success' : 'error'](`نُشر ${ok} من ${total} موعدًا — يظهر لكل مشرف جدول مناقشاته`)
    },

    snapshot(onlyConfirmed = false) {
      this.published = {
        at: new Date().toLocaleString('ar-EG-u-nu-latn', { dateStyle: 'medium', timeStyle: 'short' }),
        rows: this.plan.filter((r) => !onlyConfirmed || r.status === 'confirmed').map((r) => ({ id: r.id, section: r.g.section, supId: r.g.supId, date: r.date, time: r.time, room: r.room, examiners: [...r.examiners] }))
      }
    },

    /**
     * يستنتج تاريخ كل فئة (جنس×درجة) من المواعيد المحفوظة = التاريخ الأكثر تكرارًا لها،
     * حتى لا يظهر الجدول المحفوظ كتعارضات "يوم غير مطابق"
     */
    adoptDays(rows) {
      const mode = (list) => Object.entries(list.reduce((m, d) => ({ ...m, [d]: (m[d] || 0) + 1 }), {})).sort((x, y) => y[1] - x[1])[0]?.[0]
      this.dayKeys.forEach((d) => {
        const date = mode(rows.filter((r) => `${r.gender}-${r.g.degree}` === d.key && r.date).map((r) => r.date))
        if (date) this.s.days[d.key] = date
      })
    },

    /** يبني الجدول من مواعيد المناقشات المحفوظة في الخادم */
    fromDiscussions(list) {
      const byProject = Object.fromEntries(list.map((d) => [d.project_id, d]))
      const byName = (n) => this.idByName.get(n) ?? null
      const rows = this.groups.filter((g) => byProject[g.projectId]).map((g) => {
        const d = byProject[g.projectId]
        const [who, ...rest] = String(d.committee || '').split(' | ')
        const names = who.split(/[،,]/).map((s) => s.trim()).filter(Boolean)
        const ids = names.map(byName)
        return {
          id: g.id, g, gender: groupGender(g), region: groupRegion(g),
          date: String(d.discussion_date || '').slice(0, 10),
          time: String(d.discussion_time || '').slice(0, 5),
          duration: Number(d.duration) || null,
          room: d.place,
          examiners: [ids.find(Boolean) ?? null, ids.filter(Boolean)[1] ?? null],
          note: [...names.filter((n, i) => !ids[i]), ...rest].join('، '),
          discussionId: d.id,
          status: d.status
        }
      })
      if (!rows.length) return
      this.adoptDays(rows)
      this.plan = rows
      if (rows.some((r) => r.status === 'confirmed')) this.snapshot(true)
    }
  }
}
</script>
