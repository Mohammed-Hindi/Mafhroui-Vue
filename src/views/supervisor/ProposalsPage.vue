<template>
  <div>
    <div class="table-scroll">
      <DataTable :columns="columns" :rows="proposals" row-key="id" empty-title="لا توجد مقترحات">
        <template #cell-project="{ value }"><span class="font-bold text-text-900">{{ value }}</span></template>
        <template #cell-status="{ value }"><BaseBadge :variant="statusVariant(value)" dot>{{ statusLabel(value) }}</BaseBadge></template>
        <template #cell-actions="{ row }">
          <div class="flex gap-2">
            <BaseButton size="sm" variant="secondary" :icon="Check" :disabled="row.status !== 'pending'" @click="approve(row)">موافقة</BaseButton>
            <BaseButton size="sm" variant="danger" :icon="X" :disabled="row.status !== 'pending'" @click="openReject(row)">رفض</BaseButton>
          </div>
        </template>
      </DataTable>
    </div>

    <BaseModal v-model="rejectModal.open" title="سبب الرفض" description="سيُرسل السبب مع الرد للمقترح">
      <BaseTextarea v-model="rejectReason" placeholder="اكتبي سبب الرفض..." :rows="4" />
      <template #footer>
        <BaseButton variant="ghost" @click="rejectModal.open = false">إلغاء</BaseButton>
        <BaseButton variant="danger" :icon="X" @click="confirmReject">تأكيد الرفض</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script>
import { Check, X } from 'lucide-vue-next'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import DataTable from '@/components/ui/DataTable.vue'

const STATUS_LABELS = { pending: 'قيد المراجعة', approved: 'معتمد', rejected: 'مرفوض' }
const STATUS_VARIANTS = { pending: 'warning', approved: 'success', rejected: 'error' }

export default {
  name: 'ProposalsPage',

  components: { BaseButton, BaseModal, BaseTextarea, BaseBadge, DataTable },

  data() {
    return {
      Check,
      X,
      rejectModal: { open: false },
      rejectReason: '',
      pendingRejectId: null,
      columns: [
        { key: 'team', label: 'الفريق' },
        { key: 'project', label: 'المشروع' },
        { key: 'status', label: 'الحالة' },
        { key: 'actions', label: 'إجراءات' }
      ],
      proposals: [
        { id: 1, team: 'فريق الابتكار', project: 'منصة إدارة مشاريع التخرج', status: 'pending', rejectReason: '' },
        { id: 2, team: 'فريق البيانات', project: 'نظام تحليل بيانات الطلاب', status: 'pending', rejectReason: '' },
        { id: 3, team: 'فريق أورانج', project: 'تطبيق حجز قاعات جامعي', status: 'pending', rejectReason: '' },
        { id: 4, team: 'فريق الأمن السيبراني', project: 'أداة كشف الثغرات الأمنية', status: 'approved', rejectReason: '' }
      ]
    }
  },

  methods: {
    statusLabel(status) {
      return STATUS_LABELS[status] || status
    },
    statusVariant(status) {
      return STATUS_VARIANTS[status] || 'info'
    },

    approve(row) {
      row.status = 'approved'
      this.$toast.success(`تمت الموافقة على مقترح ${row.team}`)
    },

    openReject(row) {
      this.pendingRejectId = row.id
      this.rejectReason = ''
      this.rejectModal.open = true
    },

    confirmReject() {
      if (!this.rejectReason.trim()) {
        this.$toast.error('يرجى كتابة سبب الرفض قبل المتابعة')
        return
      }
      const row = this.proposals.find((p) => p.id === this.pendingRejectId)
      if (row) {
        row.status = 'rejected'
        row.rejectReason = this.rejectReason.trim()
        this.$toast.success(`تم رفض مقترح ${row.team}`)
      }
      this.rejectModal.open = false
    }
  }
}
</script>
