<script setup lang="ts">
interface Column {
  key: string
  label: string
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
}

interface Props {
  columns: Column[]
  items: Record<string, unknown>[]
  loading?: boolean
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  sortDir: 'desc'
})

const emit = defineEmits<{
  'row-click': [item: Record<string, unknown>]
  'sort': [key: string]
}>()

function getValue(item: Record<string, unknown>, key: string): unknown {
  // Support nested keys like "data.title"
  const keys = key.split('.')
  let value: unknown = item

  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = (value as Record<string, unknown>)[k]
    } else {
      return undefined
    }
  }

  return value
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (value instanceof Date) return value.toLocaleDateString()
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function handleSort(col: Column) {
  if (col.sortable) {
    emit('sort', col.key)
  }
}
</script>

<template>
  <div class="cms-table-wrapper">
    <div class="cms-table-scroll">
      <table class="cms-table">
        <thead class="cms-table__head">
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              class="cms-table__th"
              :class="{
                'cms-table__th--sortable': col.sortable,
                'cms-table__th--sorted': sortBy === col.key,
                [`cms-table__th--${col.align || 'left'}`]: true
              }"
              :style="col.width ? { width: col.width } : {}"
              @click="handleSort(col)"
            >
              <div class="cms-table__th-content">
                <span>{{ col.label }}</span>
                <span v-if="col.sortable" class="cms-table__sort-icon">
                  <svg v-if="sortBy === col.key && sortDir === 'asc'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="cms-table__icon">
                    <path fill-rule="evenodd" d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z" clip-rule="evenodd" />
                  </svg>
                  <svg v-else-if="sortBy === col.key && sortDir === 'desc'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="cms-table__icon">
                    <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="cms-table__icon cms-table__icon--inactive">
                    <path fill-rule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z" clip-rule="evenodd" />
                  </svg>
                </span>
              </div>
            </th>
          </tr>
        </thead>

        <tbody v-if="loading" class="cms-table__body">
          <tr>
            <td :colspan="columns.length" class="cms-table__loading">
              <div class="cms-table__loading-content">
                <span class="cms-table__spinner"></span>
                <span>Loading...</span>
              </div>
            </td>
          </tr>
        </tbody>

        <tbody v-else-if="items.length === 0" class="cms-table__body">
          <tr>
            <td :colspan="columns.length" class="cms-table__empty">
              No items found
            </td>
          </tr>
        </tbody>

        <tbody v-else class="cms-table__body">
          <tr
            v-for="item in items"
            :key="String(item.id)"
            class="cms-table__row"
            @click="$emit('row-click', item)"
          >
            <td
              v-for="col in columns"
              :key="col.key"
              class="cms-table__td"
              :class="[`cms-table__td--${col.align || 'left'}`]"
            >
              <slot :name="`cell-${col.key}`" :item="item" :value="getValue(item, col.key)">
                {{ formatValue(getValue(item, col.key)) }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style>
/* Table Wrapper */
.cms-table-wrapper {
  overflow: hidden;
}

.cms-table-scroll {
  overflow-x: auto;
}

/* Table */
.cms-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: auto;
}

/* Table Header */
.cms-table__head {
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.cms-table__th {
  padding: 12px 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.cms-table__th--sortable {
  cursor: pointer;
  user-select: none;
  transition: background-color 0.15s ease;
}

.cms-table__th--sortable:hover {
  background-color: #f3f4f6;
}

.cms-table__th--sorted {
  color: #2563eb;
}

.cms-table__th--center {
  text-align: center;
}

.cms-table__th--right {
  text-align: right;
}

.cms-table__th-content {
  display: flex;
  align-items: center;
  gap: 4px;
}

.cms-table__sort-icon {
  display: flex;
  align-items: center;
}

.cms-table__icon {
  width: 16px;
  height: 16px;
  color: #2563eb;
}

.cms-table__icon--inactive {
  color: #9ca3af;
  opacity: 0.5;
}

/* Table Body */
.cms-table__body {
  background-color: white;
}

/* Table Row */
.cms-table__row {
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.cms-table__row:hover {
  background-color: #f9fafb;
}

.cms-table__row:last-child {
  border-bottom: none;
}

/* Table Cell */
.cms-table__td {
  padding: 14px 16px;
  font-size: 14px;
  color: #111827;
  vertical-align: middle;
}

.cms-table__td--center {
  text-align: center;
}

.cms-table__td--right {
  text-align: right;
}

/* Loading State */
.cms-table__loading {
  padding: 32px 16px;
  text-align: center;
}

.cms-table__loading-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #6b7280;
}

.cms-table__spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e5e7eb;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: cms-table-spin 0.8s linear infinite;
}

@keyframes cms-table-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Empty State */
.cms-table__empty {
  padding: 32px 16px;
  text-align: center;
  color: #6b7280;
  font-size: 14px;
}

</style>
