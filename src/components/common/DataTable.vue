<template>
  <div class="data-table-wrapper">
    <PrimeDataTable
      :value="value"
      :loading="loading"
      :lazy="lazy"
      :paginator="paginator"
      :rows="rows"
      :first="first"
      :totalRecords="totalRecords"
      :rowsPerPageOptions="rowsPerPageOptions"
      :dataKey="dataKey"
      :selection="selection"
      :selectionMode="selectionMode"
      :sortField="sortField"
      :sortOrder="sortOrder"
      :currentPageReportTemplate="currentPageReportTemplate"
      :pt="pt"
      class="data-table"
      @page="onPage"
      @sort="onSort"
      @row-select="onRowSelect"
      @row-unselect="onRowUnselect"
    >
      <template v-if="$slots.header" #header>
        <div class="table-header">
          <slot name="header" />
        </div>
      </template>

      <template v-if="$slots.footer" #footer>
        <slot name="footer" />
      </template>

      <template v-if="$slots.empty" #empty>
        <slot name="empty" />
      </template>

      <template #loading>
        <slot name="loading">
          <div class="loading-overlay">
            <div class="spinner"></div>
          </div>
        </slot>
      </template>

      <slot />
    </PrimeDataTable>
  </div>
</template>

<script setup>

import PrimeDataTable from 'primevue/datatable'

const props = defineProps({
  value: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  // Server-side (lazy) pagination: the parent owns page state and refetches.
  lazy: { type: Boolean, default: true },
  paginator: { type: Boolean, default: false },
  rows: { type: Number, default: 10 },
  first: { type: Number, default: 0 },
  totalRecords: { type: Number, default: 0 },
  rowsPerPageOptions: { type: Array, default: () => [10, 25, 50] },
  dataKey: { type: String, default: '_id' },
  selectionMode: { type: String, default: null },
  selection: { type: [Object, Array], default: null },
  sortField: { type: String, default: null },
  sortOrder: { type: String, default: null },
  currentPageReportTemplate: {
    type: String,
    default: 'Showing {first} to {last} of {totalRecords} entries'
  },
  pt: { type: Object, default: null }
})

const emit = defineEmits(['page', 'selection-change', 'sort'])

const onPage = (event) => emit('page', event)

const onSort = (event) => emit('sort', event)

const onRowSelect = (event) => {
  if (!props.selectionMode) return
  emit('selection-change', props.selectionMode === 'single' ? event.data : event)
}

const onRowUnselect = (event) => {
  if (!props.selectionMode) return
  if (props.selectionMode === 'single') {
    emit('selection-change', null)
    return
  }
  if (Array.isArray(event.data)) {
    emit('selection-change', event.data)
  } else {
    const remaining = (props.selection || []).filter(
      (row) => row._id !== event.data._id
    )
    emit('selection-change', remaining)
  }
}

</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';

.data-table-wrapper {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: var(--border-radius);
  overflow: hidden;
}

.table-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--surface-border);
}

.loading-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--surface-border);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

:deep(.data-table .p-datatable-thead > tr > th) {
  background: var(--surface-ground);
  border-color: var(--surface-border);
  color: var(--text-color-secondary);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

:deep(.data-table .p-datatable-tbody > tr > td) {
  border-color: var(--surface-border);
  font-size: 0.875rem;
}

:deep(.data-table .p-datatable-tbody > tr:hover) {
  background: var(--surface-hover);
}

:deep(.data-table .p-paginator) {
  border-top: 1px solid var(--surface-border);
  border-radius: 0;
  background: var(--surface-ground);
}
</style>
