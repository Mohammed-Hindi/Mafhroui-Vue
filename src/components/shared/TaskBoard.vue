<template>
  <div>
    <!-- شريط الأدوات فوق اللوحة: أزرار إضافية من الصفحة المستهلِكة (slot: actions) + إنشاء/أرشفة -->
    <div v-if="canCreate || canDelete || $slots.actions" class="flex items-center justify-between gap-4 mb-5 flex-wrap">
      <p v-if="hint || canCreate" class="text-body-sm text-text-600" :title="hint || undefined">{{ hint || (canDrag ? 'اسحب البطاقات أو استخدم القائمة على البطاقة لتحديث الحالة' : 'الطلاب يحرّكون حالة المهام من لوحتهم') }}</p>
      <div class="flex items-center gap-2 ms-auto">
        <button v-if="canDelete" type="button" class="pbtn is-outline tb-archive" @click="openArchive"><ArchiveIcon :size="16" /> الأرشيف</button>
        <button v-if="canCreate" type="button" class="pbtn is-green tb-add" @click="openCreate()"><Plus :size="16" /> مهمة جديدة</button>
        <slot name="actions" />
      </div>
    </div>

    <div v-if="variant !== 'tk'" class="sm:hidden mb-4">
      <BaseSelect v-model="mobileStatus" label="عرض قائمة" :options="columnOptions" />
    </div>

    <!-- نمط صفحة التكليفات: نفس tk-board/tk-col/tk-dot/tk-card ونفس البطاقة القابلة للتوسّع + شريط الملخص -->
    <template v-if="variant === 'tk'">
      <div :class="['tk-board', loading && 'tk-busy']">
        <section v-for="column in columns" :key="column.id" class="tk-col">
          <header class="tk-col-head"><i :class="['tk-dot', `is-${column.id}`]" />{{ column.label }} <span>{{ tasksByColumn(column.id).length }}</span></header>
          <!-- جسم العمود: وجهة السحب (نفس منطق الكانبان — تمييز أثناء السحب ثم الإفلات) -->
          <div
            class="tk-col-body"
            :class="dragOverColumn === column.id && 'is-over'"
            @dragover.prevent
            @dragenter="dragOverColumn = column.id"
            @dragleave="dragOverColumn = null"
            @drop="onDrop(column.id)"
          >
            <article
              v-for="task in tasksByColumn(column.id)"
              :key="task.id"
              class="tk-card"
              tabindex="0"
              :draggable="canDrag && acts(task)"
              @dragstart="onDragStart(task)"
              @dragend="dragOverColumn = null"
              @click="openDetail(task)"
              @keydown.enter="openDetail(task)"
            >
              <b>{{ task.title }}</b>
              <span v-if="showSource && staffSource(task)" class="pt-muted">من {{ staffSource(task) }}</span>
              <span class="tk-card-who"><Users :size="13" /> {{ whoNames(task) }}</span>
              <footer>
                <!-- الحالة: مبدّل لمن يملك تغييرها (نفس بوابة السحب في الكانبان) وإلا الشارة -->
                <BaseSelect
                  v-if="canDrag && acts(task)"
                  class="tk-statussel"
                  :model-value="task.status"
                  :options="columnOptions"
                  aria-label="حالة المهمة"
                  @click.stop
                  @update:model-value="(val) => $emit('move', { id: task.id, status: val })"
                />
                <span v-else :class="['tk-status', `is-${task.status}`]">{{ columnLabel(task.status) }}</span>
                <span v-if="canEditTask || canDelete" class="tk-card-acts" @click.stop>
                  <button v-if="canEditTask" type="button" aria-label="تعديل المهمة" title="تعديل المهمة" @click="openDetail(task)"><Pencil :size="13" /></button>
                  <button v-if="canDelete" type="button" aria-label="أرشفة المهمة" title="أرشفة المهمة" @click="$emit('archive', task.id)"><ArchiveIcon :size="13" /></button>
                </span>
              </footer>
              <!-- المرفقات والملاحظات وسجل الحركة — يُجلب عند الفتح (GET /tasks/{id}/files + /activity + load-notes) -->
              <button type="button" class="tk-card-more" :aria-expanded="!!openInfo[task.id]" @click.stop="toggleCardInfo(task)">
                <History :size="13" /> المرفقات والملاحظات <ChevronDown :size="13" :class="openInfo[task.id] && 'is-open'" />
              </button>
              <div v-if="openInfo[task.id]" class="tk-card-info" @click.stop>
                <SkeletonLoader v-if="infoLoading[task.id]" :rows="3" height="14px" />
                <template v-else>
                  <h5 class="tk-info-title"><Paperclip :size="14" /> المرفقات <span>{{ (shownFiles[task.id] || []).length }}</span></h5>
                  <ul v-if="(shownFiles[task.id] || []).length" class="tk-files">
                    <li v-for="f in shownFiles[task.id]" :key="f.id" :title="f.name"><FileText :size="14" /> <bdi>{{ f.name }}</bdi></li>
                  </ul>
                  <p v-else class="tk-info-empty">لا توجد مرفقات</p>
                  <!-- رفع ملفات (uploads): فعلي عند uploads-live — نفس منطق الكانبان وبوابته -->
                  <div v-if="uploads" class="tb-upload mt-2" @click.stop>
                    <label v-if="acts(task)" class="tb-upload-drop" @dragover.prevent @drop.prevent="addFiles(task.id, $event.dataTransfer.files)">
                      <input type="file" multiple class="sr-only" @change="addFiles(task.id, $event.target.files); $event.target.value = ''">
                      <Paperclip :size="14" /> إضافة ملف
                    </label>
                    <button v-if="uploadsLive && !isPlaceholderTask(task) && !shownFiles[task.id]" type="button" class="tb-upload-more" @click="loadFiles(task.id)">عرض الملفات المرفوعة</button>
                    <ul v-if="(files[task.id] || []).length" class="tb-upload-list">
                      <li v-for="(f, i) in files[task.id]" :key="i">
                        <span class="tb-upload-name"><bdi>{{ f.name }}</bdi></span>
                        <span v-if="f.state" class="pt-muted">{{ f.state }}</span>
                        <button v-if="!uploadsLive || isPlaceholderTask(task)" type="button" :aria-label="`إزالة ${f.name}`" @click="files[task.id].splice(i, 1)"><X :size="12" /></button>
                      </li>
                    </ul>
                  </div>

                  <h5 class="tk-info-title"><MessageSquare :size="14" /> الملاحظات <span>{{ (notesByTask[task.id] || []).length }}</span></h5>
                  <p v-if="notesLoadingByTask[task.id]" class="tk-info-empty">جارٍ التحميل…</p>
                  <ol v-else-if="(notesByTask[task.id] || []).length" class="tk-card-log">
                    <li v-for="note in notesByTask[task.id]" :key="note.id">
                      <b>{{ note.user?.name || '—' }}</b>
                      <span>{{ note.note }}</span>
                      <time>{{ formatRelativeTime(note.created_at) }}</time>
                    </li>
                  </ol>
                  <p v-else class="tk-info-empty">لا توجد ملاحظات بعد</p>
                  <form v-if="canNote" class="tk-note-form" @submit.prevent="submitNote(task.id)">
                    <input v-model.trim="noteDrafts[task.id]" type="text" class="ev-input" placeholder="اكتب ملاحظة…">
                    <button type="submit" class="pbtn is-green is-sm">إضافة</button>
                  </form>

                  <template v-if="ownsLog(task)">
                    <h5 class="tk-info-title"><History :size="14" /> سجل الحركة <span>{{ Array.isArray(logs[task.id]) ? logs[task.id].length : 0 }}</span></h5>
                    <p v-if="logs[task.id] === 'loading'" class="tk-info-empty">جارٍ التحميل…</p>
                    <ol v-else-if="(logs[task.id] || []).length" class="tk-card-log">
                      <li v-for="(e, i) in logs[task.id]" :key="i">
                        <b>{{ e.user?.name || 'النظام' }}</b>
                        <span>{{ describeTaskEvent(e) }}</span>
                        <time>{{ formatRelativeTime(e.created_at) }}</time>
                      </li>
                    </ol>
                    <p v-else class="tk-info-empty">لا توجد حركات مسجّلة بعد</p>
                  </template>
                </template>
              </div>
            </article>
            <p v-if="!tasksByColumn(column.id).length" class="tk-col-empty">لا توجد مهام</p>
          </div>
        </section>
      </div>
      <div class="gr-sumbar">
        <span>عدد المهام: {{ tasks.length }}</span>
        <span>المكتملة: {{ tasksByColumn('done').length }}</span>
        <span>قيد التنفيذ: {{ tasksByColumn('in_progress').length }}</span>
        <span>قيد المراجعة: {{ tasksByColumn('review').length }}</span>
        <span>نسبة الإنجاز: {{ progressPct }}%</span>
      </div>
    </template>

    <!-- خلفية شبكية هادئة خلف الأعمدة، بلمسة "لوحة عمل" -->
    <div v-else class="task-board relative rounded-xl p-4 sm:p-5 board-grid-bg">
      <!-- هيكل تحميل بنفس شكل الأعمدة والبطاقات -->
      <SkeletonLoader v-if="loading" variant="board" :cols="columns.length" :rows="2" />
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 relative">
        <div
          v-for="column in columns"
          :key="column.id"
          class="task-col bg-surface/90 backdrop-blur-sm rounded-xl border border-border-soft shadow-card flex-col min-h-[440px] overflow-hidden sm:flex"
          :class="mobileStatus === column.id ? 'flex' : 'hidden'"
          @dragover.prevent
          @drop="onDrop(column.id)"
        >
          <div class="task-col-head flex items-center justify-between gap-2 px-4 py-3.5 border-b border-border-soft shrink-0" :class="column.headBg">
            <span class="flex items-center gap-2 font-cairo font-bold text-body-sm text-text-900">
              <span class="w-2 h-2 rounded-pill shrink-0" :class="column.dot" />
              {{ column.label }}
            </span>
            <span class="grid place-items-center min-w-[24px] h-[24px] px-1.5 rounded-pill bg-surface border border-border-soft text-label font-bold text-text-600 shadow-[0_1px_2px_rgba(0,0,0,.04)]">
              {{ tasksByColumn(column.id).length }}
            </span>
          </div>

          <!-- عمود فائض بالمهام: عجلة الفأرة تبقى داخله ولا تحرّك الصفحة كاملة؛ العمود القصير لا يحجز التمرير -->
          <div
            class="flex-1 flex flex-col gap-2.5 p-3 overflow-y-auto scrollbar-thin transition-colors duration-fast"
            :class="dragOverColumn === column.id && 'bg-primary-50/40'"
            @mouseenter="e => e.currentTarget.style.overscrollBehavior = e.currentTarget.scrollHeight > e.currentTarget.clientHeight ? 'contain' : ''"
            @dragenter="dragOverColumn = column.id"
            @dragleave="dragOverColumn = null"
          >
            <div
              v-for="task in tasksByColumn(column.id)"
              :key="task.id"
              :draggable="canDrag && acts(task)"
              class="task-card bg-surface rounded-lg border border-border shadow-card p-3.5 transition-colors duration-fast hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer"
              :class="[canDrag && acts(task) && 'cursor-grab active:cursor-grabbing']"
              @dragstart="onDragStart(task)"
              @dragend="dragOverColumn = null"
              @click="openDetail(task)"
            >
              <div class="flex items-start justify-between gap-2 mb-1.5">
                <p class="text-body-sm font-bold text-text-900 leading-snug flex-1">{{ task.title }}</p>
                <div v-if="canEditTask || canDelete" class="flex items-center gap-1 shrink-0" @click.stop>
                  <button
                    v-if="canEditTask"
                    type="button"
                    class="grid place-items-center w-6 h-6 rounded-sm text-text-400 hover:bg-primary-50 hover:text-primary-700 transition-colors duration-fast"
                    aria-label="تعديل المهمة"
                    title="تعديل المهمة"
                    @click="openDetail(task)"
                  >
                    <Pencil :size="13" />
                  </button>
                  <button
                    v-if="canDelete"
                    type="button"
                    class="grid place-items-center w-6 h-6 rounded-sm text-text-400 hover:bg-error-bg hover:text-error transition-colors duration-fast"
                    aria-label="أرشفة المهمة"
                    title="أرشفة المهمة"
                    @click="$emit('archive', task.id)"
                  >
                    <ArchiveIcon :size="13" />
                  </button>
                </div>
              </div>

              <!-- مصدر المهمة إن جاءت من المشرف أو لجنة الإشراف أو الإدارة العامة -->
              <span v-if="showSource && staffSource(task)" class="tb-source">من {{ staffSource(task) }}</span>
              <p v-if="task.description" class="tb-desc">{{ task.description }}</p>
              <!-- لمن أُسندت المهمة: دائرة بالحرف الأول + الاسم الأول؛ بلا مكلّفين = كل الفريق -->
              <div class="tb-assignees">
                <template v-if="(task.assignees || []).length">
                  <span v-for="a in task.assignees" :key="a.id" class="tb-assignee" :title="a.name"><i>{{ shortName(a.name).charAt(0) }}</i>{{ shortName(a.name) }}</span>
                </template>
                <span v-else class="tb-assignee is-team"><i><Users :size="11" /></i>كل الفريق</span>
              </div>

              <div v-if="canDrag && acts(task)" class="mt-2" @click.stop>
                <BaseSelect
                  :model-value="task.status" :options="columnOptions"
                  @update:model-value="(val) => $emit('move', { id: task.id, status: val })"
                />
              </div>
              <p v-else-if="canDrag" class="text-label text-text-400 mt-2">مهمة زميلك — للاطلاع والملاحظات فقط</p>

              <!-- إضافة ملفات للمهمة: uploads-live = رفع فعلي POST /tasks/{id}/files (الطالب)، وإلا placeholder محلي بلا إرسال -->
              <div v-if="uploads" class="tb-upload mt-2.5 pt-2.5 border-t border-border-soft" @click.stop>
                <label v-if="acts(task)" class="tb-upload-drop" @dragover.prevent @drop.prevent="addFiles(task.id, $event.dataTransfer.files)">
                  <input type="file" multiple class="sr-only" @change="addFiles(task.id, $event.target.files); $event.target.value = ''">
                  <Paperclip :size="14" /> إضافة ملف
                </label>
                <button v-if="uploadsLive && !isPlaceholderTask(task) && !shownFiles[task.id]" type="button" class="tb-upload-more" @click="loadFiles(task.id)">عرض الملفات المرفوعة</button>
                <ul v-if="(shownFiles[task.id] || []).length" class="tb-upload-list">
                  <li v-for="sf in shownFiles[task.id]" :key="'s' + sf.id"><FileText :size="12" /><span class="tb-upload-name"><bdi>{{ sf.name }}</bdi></span><span class="pt-muted">مرفوع</span></li>
                </ul>
                <ul v-if="(files[task.id] || []).length" class="tb-upload-list">
                  <li v-for="(f, i) in files[task.id]" :key="i">
                    <span class="tb-upload-name"><bdi>{{ f.name }}</bdi></span>
                    <span v-if="f.state" class="pt-muted">{{ f.state }}</span>
                    <button v-if="!uploadsLive || isPlaceholderTask(task)" type="button" :aria-label="`إزالة ${f.name}`" @click="files[task.id].splice(i, 1)"><X :size="12" /></button>
                  </li>
                </ul>
              </div>

              <!-- مرفقات المهمة على البطاقة (المشرف/اللجنة): تُجلب عند الفتح GET /tasks/{id}/files -->
              <div v-if="!uploads && !isPlaceholderTask(task)" class="tb-files-wrap" @click.stop>
                <button type="button" class="tb-files-btn" :aria-expanded="!!openFiles[task.id]" @click="toggleFiles(task.id)">
                  <Paperclip :size="13" /> المرفقات
                  <span v-if="shownFiles[task.id]">{{ shownFiles[task.id].length }}</span>
                  <ChevronDown :size="12" :class="['tb-files-caret', openFiles[task.id] && 'is-open']" />
                </button>
                <template v-if="openFiles[task.id]">
                  <SkeletonLoader v-if="!shownFiles[task.id]" :rows="1" height="24px" />
                  <ul v-else-if="shownFiles[task.id].length" class="tk-files tb-files">
                    <li v-for="sf in shownFiles[task.id]" :key="sf.id" :title="sf.name"><FileText :size="13" /><bdi>{{ sf.name }}</bdi></li>
                  </ul>
                  <p v-else class="tk-info-empty">لا توجد مرفقات</p>
                </template>
              </div>

              <!-- سجل الحركة (GET /tasks/{id}/activity): من نقل المهمة ومن أي حالة لأي حالة، وكل تعديل — يُجلب عند الفتح -->
              <div v-if="ownsLog(task)" class="mt-2.5 pt-2.5 border-t border-border-soft" @click.stop>
                <button
                  type="button"
                  class="flex items-center gap-1.5 text-label font-semibold text-primary-600 hover:text-primary-700 transition-colors duration-fast"
                  @click="toggleLog(task.id)"
                >
                  <History :size="12" /> سجل الحركة
                  <ChevronDown :size="12" :class="['transition-transform duration-fast', logs[task.id] && 'rotate-180']" />
                </button>
                <template v-if="logs[task.id]">
                  <p v-if="logs[task.id] === 'loading'" class="text-label text-text-400 mt-1">جارٍ التحميل…</p>
                  <ol v-else-if="logs[task.id].length" class="tb-log">
                    <li v-for="(e, i) in logs[task.id]" :key="i"><b>{{ e.user?.name || 'النظام' }}</b> {{ describeTaskEvent(e) }} · {{ formatRelativeTime(e.created_at) }}</li>
                  </ol>
                  <p v-else class="text-label text-text-400 mt-1">لا توجد حركات مسجّلة بعد</p>
                </template>
              </div>

              <div class="mt-2.5 pt-2.5 border-t border-border-soft" @click.stop>
                <button
                  type="button"
                  class="flex items-center gap-1.5 text-label font-semibold text-primary-600 hover:text-primary-700 transition-colors duration-fast"
                  @click="toggleNotes(task)"
                >
                  <MessageSquare :size="12" />
                  الملاحظات
                  <span v-if="(notesByTask[task.id] || []).length" class="tb-count">{{ (notesByTask[task.id] || []).length }}</span>
                  <ChevronDown :size="12" :class="['transition-transform duration-fast', isNotesOpen(task.id) && 'rotate-180']" />
                </button>

                <div v-if="isNotesOpen(task.id)" class="mt-2 flex flex-col gap-2">
                  <SkeletonLoader v-if="notesLoadingByTask[task.id]" :rows="2" height="28px" />
                  <template v-else>
                    <p v-if="!(notesByTask[task.id] || []).length" class="text-label text-text-400 text-center py-1">لا توجد ملاحظات بعد</p>
                    <div v-for="note in notesByTask[task.id]" :key="note.id" class="bg-bg rounded-sm p-2">
                      <div class="flex items-center justify-between gap-2 mb-0.5">
                        <span class="text-label font-bold text-text-700">{{ note.user?.name || '—' }}</span>
                        <span class="text-label text-text-400 shrink-0">{{ formatRelativeTime(note.created_at) }}</span>
                      </div>
                      <p class="text-caption text-text-600 leading-relaxed">{{ note.note }}</p>
                    </div>
                  </template>
                  <div v-if="canNote" class="flex items-center gap-1.5 tb-note-add">
                    <input
                      v-model="noteDrafts[task.id]" type="text" placeholder="اكتب ملاحظة..."
                      class="flex-1 h-8 px-2.5 rounded-sm border border-border bg-surface text-caption text-text-900 focus:border-primary-600 transition-colors duration-fast"
                      @keydown.enter="submitNote(task.id)"
                    >
                    <button
                      type="button"
                      class="grid place-items-center h-8 px-2.5 rounded-sm bg-primary-600 text-white text-caption font-bold hover:bg-primary-700 transition-colors duration-fast shrink-0"
                      @click="submitNote(task.id)"
                    >
                      إضافة
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <p v-if="!tasksByColumn(column.id).length" class="text-center text-label text-text-400 py-8">لا توجد مهام</p>
          </div>
        </div>
      </div>
    </div>

    <!-- مهمة جديدة بهوية البوابة: الاسم والوصف والمنتسبون إلزامية، والملاحظات والملفات اختيارية -->
    <BaseModal v-model="modalOpen" title="مهمة جديدة" size="lg">
      <form id="tb-create-form" class="sp-form" @submit.prevent="saveTask">
        <label class="pfield">
          <span>اسم المهمة <b class="as-req">*</b></span>
          <input v-model.trim="form.title" type="text" maxlength="200" placeholder="مثال: تجهيز الفصل الثاني من التقرير">
        </label>
        <label class="pfield">
          <span>وصف المهمة <b class="as-req">*</b></span>
          <textarea v-model.trim="form.description" rows="4" placeholder="ما المطلوب تسليمه، وكيف، ومعايير القبول" />
        </label>
        <div v-if="members.length" class="pfield">
          <span>تنتسب المهمة إلى <b class="as-req">*</b></span>
          <div class="as-assignees">
            <label class="gp-check"><input type="checkbox" :checked="form.assignees.length === members.length" @change="form.assignees = $event.target.checked ? members.map((m) => m.id) : []"> كل الطلاب</label>
            <label v-for="m in members" :key="m.id" class="gp-check"><input v-model="form.assignees" type="checkbox" :value="m.id"> {{ m.name }}</label>
          </div>
        </div>
        <label class="pfield">
          <span>ملاحظات (اختياري)</span>
          <textarea v-model.trim="form.note" rows="2" placeholder="ملاحظة تظهر للطلاب على المهمة" />
        </label>
        <div class="pfield">
          <span>ملفات المهمة (اختياري)</span>
          <FileDropzone v-model="form.files" multiple />
        </div>
      </form>
      <template #footer>
        <span :class="['as-summary', !canSave && 'is-missing']">{{ canSave ? `${form.assignees.length || 'كل'} طالب · ${form.files.length} ملف` : 'أدخل اسم المهمة ووصفها واختر الطلاب' }}</span>
        <button type="button" class="pbtn is-outline" @click="modalOpen = false">إلغاء</button>
        <button type="submit" form="tb-create-form" class="pbtn is-green" :disabled="!canSave"><Plus :size="16" /> إضافة المهمة</button>
      </template>
    </BaseModal>

    <!-- تفاصيل / تعديل المهمة -->
    <!-- تفاصيل المهمة كاملة: الحالة والمكلّفون والمصدر والتواريخ، الوصف، الملفات المرفوعة، الملاحظات، وسجل الحركة.
         من يملك صلاحية التعديل يعدّل العنوان والوصف من نفس النافذة -->
    <BaseModal v-model="detailModalOpen" :title="canEditTask ? 'تعديل المهمة' : 'تفاصيل المهمة'" size="lg">
      <div v-if="detailTask" class="td">
        <!-- رأس البوب اب: عنوان المهمة (للقراءة) وحالة المهمة -->
        <header class="td-head">
          <h3 v-if="!canEditTask" class="td-title">{{ detailTask.title }}</h3>
          <span :class="['td-status', `is-${detailTask.status}`]">{{ columnLabel(detailTask.status) }}</span>
        </header>

        <dl class="td-meta">
          <div><dt>المكلّفون</dt><dd>{{ (detailTask.assignees || []).map((a) => a.name).join('، ') || 'كل الفريق' }}</dd></div>
          <div><dt>أضافها</dt><dd>{{ detailTask.created_by?.name || '—' }}<small v-if="staffSource(detailTask)"> · {{ staffSource(detailTask) }}</small></dd></div>
          <div><dt>تاريخ الإضافة</dt><dd class="mono">{{ shortDate(detailTask.created_at) }}</dd></div>
          <div v-if="detailTask.due_date"><dt>موعد التسليم</dt><dd class="mono">{{ shortDate(detailTask.due_date) }}</dd></div>
        </dl>

        <section class="td-sec">
          <h4>{{ canEditTask ? 'العنوان والوصف' : 'الوصف' }}</h4>
          <template v-if="canEditTask">
            <BaseInput v-model="detailForm.title" label="عنوان المهمة" required />
            <BaseTextarea v-model="detailForm.description" label="الوصف" placeholder="لا يوجد وصف" :rows="4" class="mt-3" />
          </template>
          <template v-else>
            <p class="td-text">{{ detailTask.description || 'لا يوجد وصف لهذه المهمة.' }}</p>
          </template>
        </section>

        <section class="td-sec">
          <h4><Paperclip :size="15" /> الملفات المرفوعة <small v-if="detailFiles.length">({{ detailFiles.length }})</small></h4>
          <p v-if="!isPlaceholderTask(detailTask) && !shownFiles[detailTask.id]" class="td-muted">جارٍ التحميل…</p>
          <ul v-else-if="detailFiles.length" class="td-files">
            <li v-for="sf in detailFiles" :key="sf.id || sf.name"><FileText :size="15" /><bdi>{{ sf.name }}</bdi></li>
          </ul>
          <p v-else class="td-muted">لا توجد ملفات مرفوعة</p>
        </section>

        <section class="td-sec">
          <h4><MessageSquare :size="15" /> الملاحظات <small v-if="(notesByTask[detailTask.id] || []).length">({{ (notesByTask[detailTask.id] || []).length }})</small></h4>
          <p v-if="notesLoadingByTask[detailTask.id]" class="td-muted">جارٍ التحميل…</p>
          <template v-else>
            <p v-if="!(notesByTask[detailTask.id] || []).length" class="td-muted">لا توجد ملاحظات بعد</p>
            <div v-for="note in notesByTask[detailTask.id]" :key="note.id" class="td-note">
              <header><b>{{ note.user?.name || '—' }}</b><span>{{ formatRelativeTime(note.created_at) }}</span></header>
              <p>{{ note.note }}</p>
            </div>
          </template>
          <div v-if="canNote" class="td-note-add">
            <input v-model="noteDrafts[detailTask.id]" type="text" placeholder="اكتب ملاحظة…" @keydown.enter="submitNote(detailTask.id)">
            <BaseButton size="sm" @click="submitNote(detailTask.id)">إضافة</BaseButton>
          </div>
        </section>

        <section v-if="ownsLog(detailTask)" class="td-sec">
          <h4><History :size="15" /> سجل الحركة</h4>
          <p v-if="!isPlaceholderTask(detailTask) && (logs[detailTask.id] === 'loading' || !logs[detailTask.id])" class="td-muted">جارٍ التحميل…</p>
          <ol v-else-if="(logs[detailTask.id] || []).length" class="td-log">
            <li v-for="(e, i) in logs[detailTask.id]" :key="i"><b>{{ e.user?.name || 'النظام' }}</b> {{ describeTaskEvent(e) }} <span>{{ formatRelativeTime(e.created_at) }}</span></li>
          </ol>
          <p v-else class="td-muted">لا توجد حركات مسجّلة بعد</p>
        </section>
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="detailModalOpen = false">{{ canEditTask ? 'إلغاء' : 'إغلاق' }}</BaseButton>
        <BaseButton v-if="canEditTask" :icon="Check" :disabled="!detailForm.title.trim()" @click="saveDetail">حفظ التعديلات</BaseButton>
      </template>
    </BaseModal>

    <!-- أرشيف المهام -->
    <BaseModal v-model="archiveModalOpen" title="أرشيف المهام" description="استرجعي أي مهمة تمت أرشفتها بالخطأ، أو احذفيها نهائيًا" size="lg">
      <SkeletonLoader v-if="trashedLoading" :rows="3" height="60px" />
      <EmptyState v-else-if="!trashedTasks.length" title="لا توجد مهام مؤرشفة" description="كل مهمة يتم أرشفتها ستظهر هنا وبإمكانك استرجاعها أو حذفها نهائيًا." />
      <div v-else class="flex flex-col gap-2 max-h-96 overflow-y-auto scrollbar-thin">
        <div v-for="task in trashedTasks" :key="task.id" class="flex items-center justify-between gap-3 p-3 rounded-sm border border-border bg-bg flex-wrap">
          <div class="min-w-0 flex-1">
            <div class="font-bold text-text-900 truncate">{{ task.title }}</div>
            <div v-if="task.description" class="text-caption text-text-400 truncate">{{ task.description }}</div>
          </div>
          <div class="flex items-center gap-2">
            <BaseButton variant="outline" size="sm" :icon="RotateCcw" :loading="restoringId === task.id" @click="$emit('restore', task.id)">استرجاع</BaseButton>
            <BaseButton variant="danger" size="sm" :icon="Trash2" :loading="forceDeletingId === task.id" @click="confirmForceDelete(task)">حذف نهائي</BaseButton>
          </div>
        </div>
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="archiveModalOpen = false">إغلاق</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script>
import { Plus, Archive as ArchiveIcon, Check, RotateCcw, MessageSquare, ChevronDown, Pencil, Trash2, Paperclip, X, History, FileText, Users } from 'lucide-vue-next'
import api from '@/services/api'
import { describeTaskEvent } from '@/utils/progressData'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { ROLE_LABELS } from '@/utils/constants'
import { useAuthStore } from '@/stores/auth.store'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import FileDropzone from '@/components/shared/FileDropzone.vue'
import { formatRelativeTime, shortName } from '@/utils/formatters'

const COLUMNS = [
  { id: 'pending', label: 'قيد الانتظار', dot: 'bg-text-400', headBg: '' },
  { id: 'in_progress', label: 'قيد التنفيذ', dot: 'bg-primary-500', headBg: 'bg-primary-50/50' },
  { id: 'review', label: 'مراجعة', dot: 'bg-warning', headBg: 'bg-warning-bg/50' },
  { id: 'done', label: 'مكتمل', dot: 'bg-success', headBg: 'bg-success-bg/50' }
]

export default {
  name: 'TaskBoard',

  components: { BaseButton, BaseModal, BaseInput, BaseTextarea, BaseSelect, EmptyState, FileDropzone, SkeletonLoader, Plus, MessageSquare, ChevronDown, Pencil, ArchiveIcon, Paperclip, X, History, FileText, Users },

  props: {
    tasks: { type: Array, default: () => [] },
    /** جارٍ التحميل: تُعرض هيكل لوحة بنفس شكل الأعمدة بدل الكروت */
    loading: { type: Boolean, default: false },
    canCreate: { type: Boolean, default: false },
    canDrag: { type: Boolean, default: false },
    canDelete: { type: Boolean, default: false },
    trashedTasks: { type: Array, default: () => [] },
    trashedLoading: { type: Boolean, default: false },
    restoringId: { type: [Number, String], default: null },
    forceDeletingId: { type: [Number, String], default: null },
    notesByTask: { type: Object, default: () => ({}) },
    notesLoadingByTask: { type: Object, default: () => ({}) },
    /** خانة رفع ملفات على كل بطاقة (مهامي) */
    uploads: { type: Boolean, default: false },
    /** رفع فعلي للملفات (POST /tasks/{id}/files — مسموح للطالب) بدل الـ placeholder */
    uploadsLive: { type: Boolean, default: false },
    /** إظهار "سجل الحركة" على البطاقات (يُخفى في لوحة الطالب) */
    showLog: { type: Boolean, default: true },
    /** هل يحرّك المستخدم هذه المهمة ويرفع ملفاتها (الطالب: المهام المنتسب لها فقط) — بلا دالة = كل المهام */
    canAct: { type: Function, default: null },
    /** وسم مصدر المهمة (المشرف / لجنة الإشراف / الإدارة العامة) — لوحة الطالب */
    showSource: { type: Boolean, default: false },
    /** إضافة ملاحظات على المهمة (الطالب يقرأ الملاحظات فقط ويحرّك الحالة) */
    canNote: { type: Boolean, default: true },
    /** طلاب المجموعة لاختيار المنتسبين للمهمة الجديدة */
    members: { type: Array, default: () => [] },
    /** سطر إرشادي فوق اللوحة (المشرف: اسم مشروع الشعبة المختارة) */
    hint: { type: String, default: '' },
    /** شكل اللوحة: kanban (الافتراضي) أو tk = لوحة صفحة التكليفات نفسها (tk-board/tk-col/tk-card) */
    variant: { type: String, default: 'kanban' }
  },

  emits: ['create', 'move', 'archive', 'update', 'open-archive', 'restore', 'force-delete', 'load-notes', 'add-note'],

  data() {
    return {
      files: {},
      logs: {},
      shownFiles: {},
      openFiles: {},
      openInfo: {},
      infoLoading: {},
      Plus,
      ArchiveIcon,
      Check,
      RotateCcw,
      Pencil,
      Trash2,
      formatRelativeTime,
      shortName,
      columns: COLUMNS,
      mobileStatus: COLUMNS[0].id,
      modalOpen: false,
      draggingId: null,
      dragOverColumn: null,
      form: { title: '', description: '', assignees: [], note: '', files: [] },

      detailModalOpen: false,
      detailForm: { id: null, title: '', description: '' },
      detailTask: null,

      archiveModalOpen: false,

      openNotesIds: [],
      noteDrafts: {}
    }
  },

  computed: {
    myId() {
      return useAuthStore().user?.id
    },

    /** ملفات المهمة في التفاصيل: المرفوعة سابقًا + ما أُضيف الآن */
    detailFiles() {
      const id = this.detailTask?.id
      return id == null ? [] : [...(this.shownFiles[id] || []), ...(this.files[id] || [])]
    },

    // الاسم والوصف إلزاميان، والمنتسبون إلزاميون حين تتوفر قائمة الطلاب
    canSave() {
      const f = this.form
      return !!f.title.trim() && !!f.description.trim() && (!this.members.length || f.assignees.length > 0)
    },
    columnOptions() {
      return this.columns.map((c) => ({ value: c.id, label: c.label }))
    },
    // التعديل مسموح فقط لمن يقدر ينشئ مهام (المشرف ومسؤول الفريق في الخادم) — نفس صلاحية الباك-إند
    canEditTask() {
      return this.canCreate
    },
    /** نسبة الإنجاز في شريط الملخص (نمط التكليفات) */
    progressPct() {
      const total = this.tasks.length
      return total ? Math.round((this.tasksByColumn('done').length / total) * 100) : 0
    }
  },

  methods: {
    /** سجل الحركة يظهر فقط لمن أنشأ المهمة */
    ownsLog(task) {
      return this.showLog && !!task && task.created_by?.id === this.myId
    },

    staffSource(task) {
      const role = task.created_by?.role
      return role && role !== 'student' ? ROLE_LABELS[role] : ''
    },

    acts(task) {
      return !this.canAct || this.canAct(task)
    },

    describeTaskEvent,

    /** فتح/طي سجل حركة المهمة */
    async toggleLog(id) {
      if (this.logs[id]) {
        this.logs = { ...this.logs, [id]: undefined }
        return
      }
      this.logs = { ...this.logs, [id]: 'loading' }
      try {
        const { data } = await api.get(`/tasks/${id}/activity`)
        this.logs = { ...this.logs, [id]: data }
      } catch {
        this.logs = { ...this.logs, [id]: [] }
      }
    },

    isPlaceholderTask: (t) => Number(t?.id) < 0,

    /** إضافة ملفات للبطاقة: رفع فعلي لكل ملف (uploadsLive) أو عرض محلي فقط (placeholder / مهمة تجريبية) */
    async addFiles(id, list) {
      const items = [...list].map((file) => ({ name: file.name, file, state: this.uploadsLive && id > 0 ? 'جارٍ الرفع…' : '' }))
      this.files = { ...this.files, [id]: [...(this.files[id] || []), ...items] }
      if (!this.uploadsLive || id < 0) return
      for (const it of items) {
        const fd = new FormData()
        fd.append('file', it.file)
        try {
          await api.post(`/tasks/${id}/files`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
          it.state = 'تم الرفع'
        } catch (err) {
          it.state = 'تعذّر الرفع'
          this.$toast?.error(err.normalized?.message || `تعذّر رفع ${it.name}`)
        }
      }
      this.files = { ...this.files }
    },

    /** الملفات المرفوعة سابقًا للمهمة (GET /tasks/{id}/files) */
    toggleFiles(id) {
      this.openFiles = { ...this.openFiles, [id]: !this.openFiles[id] }
      if (this.openFiles[id] && !this.shownFiles[id]) this.loadFiles(id)
    },

    /** أسماء المنتسبين في بطاقة نمط التكليفات: بلا مكلّفين = كل الفريق */
    whoNames(task) {
      return (task.assignees || []).map((a) => a.name).join('، ') || 'كل الفريق'
    },

    /** فتح/طي منطقة المرفقات والملاحظات والسجل على البطاقة — يُجلب كل شيء عند الفتح */
    async toggleCardInfo(task) {
      const id = task.id
      if (this.openInfo[id]) {
        this.openInfo = { ...this.openInfo, [id]: false }
        return
      }
      this.openInfo = { ...this.openInfo, [id]: true }
      if (this.isPlaceholderTask(task)) return
      const jobs = []
      if (!this.shownFiles[id]) jobs.push(this.loadFiles(id))
      if (!this.notesByTask[id]) this.$emit('load-notes', id)
      if (this.ownsLog(task) && !this.logs[id]) jobs.push(this.toggleLog(id))
      if (!jobs.length) return
      this.infoLoading = { ...this.infoLoading, [id]: true }
      await Promise.all(jobs)
      this.infoLoading = { ...this.infoLoading, [id]: false }
    },

    async loadFiles(id) {
      try {
        const { data } = await api.get(`/tasks/${id}/files`)
        this.shownFiles = { ...this.shownFiles, [id]: (data.data || data).map((x) => ({ id: x.id, name: String(x.file_path || x.name || '').split('/').pop() })) }
      } catch {
        this.shownFiles = { ...this.shownFiles, [id]: [] }
      }
    },

    tasksByColumn(columnId) {
      return this.tasks.filter((t) => t.status === columnId)
    },

    openCreate() {
      this.form = { title: '', description: '', assignees: [], note: '', files: [] }
      this.modalOpen = true
    },

    saveTask() {
      if (!this.canSave) return
      const f = this.form
      this.$emit('create', { title: f.title, description: f.description, assignee_ids: f.assignees, note: f.note, files: f.files })
      this.modalOpen = false
    },

    /** فتح التفاصيل: يُجلب للمهمة ملفاتها وملاحظاتها وسجل حركتها إن لم تكن محمّلة */
    openDetail(task) {
      this.detailTask = task
      this.detailForm = { id: task.id, title: task.title, description: task.description || '' }
      this.detailModalOpen = true
      if (this.isPlaceholderTask(task)) return
      if (!this.shownFiles[task.id]) this.loadFiles(task.id)
      if (!this.notesByTask[task.id]) this.$emit('load-notes', task.id)
      if (this.ownsLog(task) && !this.logs[task.id]) this.toggleLog(task.id)
    },

    columnLabel(status) {
      return this.columns.find((c) => c.id === status)?.label || status || '—'
    },

    shortDate(v) {
      return v ? String(v).slice(0, 10) : '—'
    },

    saveDetail() {
      if (!this.detailForm.title.trim()) return
      this.$emit('update', { id: this.detailForm.id, title: this.detailForm.title, description: this.detailForm.description })
      this.detailModalOpen = false
    },

    openArchive() {
      this.archiveModalOpen = true
      this.$emit('open-archive')
    },

    confirmForceDelete(task) {
      if (!window.confirm(`سيتم حذف مهمة "${task.title}" نهائيًا ولا يمكن التراجع عن هذا الإجراء. متابعة؟`)) return
      this.$emit('force-delete', task.id)
    },

    onDragStart(task) {
      if (!this.canDrag || !this.acts(task)) return
      this.draggingId = task.id
    },

    onDrop(columnId) {
      this.dragOverColumn = null
      if (!this.canDrag || !this.draggingId) return
      this.$emit('move', { id: this.draggingId, status: columnId })
      this.draggingId = null
    },

    isNotesOpen(taskId) {
      return this.openNotesIds.includes(taskId)
    },
    toggleNotes(task) {
      if (this.isNotesOpen(task.id)) {
        this.openNotesIds = this.openNotesIds.filter((id) => id !== task.id)
        return
      }
      this.openNotesIds = [...this.openNotesIds, task.id]
      this.$emit('load-notes', task.id)
    },
    submitNote(taskId) {
      const note = (this.noteDrafts[taskId] || '').trim()
      if (!note) return
      this.$emit('add-note', { id: taskId, note })
      this.noteDrafts = { ...this.noteDrafts, [taskId]: '' }
    }
  }
}
</script>

<style scoped>
.board-grid-bg {
  background-color: var(--color-bg);
  background-image: radial-gradient(circle, var(--color-border) 1px, transparent 1px);
  background-size: 22px 22px;
}
</style>
