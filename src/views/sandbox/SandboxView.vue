<template>
  <MainLayout>
    <div class="sandbox-view">
      <div class="view-header">
        <div>
          <h1>Sandbox (API Testing)</h1>
          <p class="subtitle">Send live requests against the routes the server actually exposes</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" :disabled="runningAll" @click="runAllSafe">
            {{ runningAll ? 'Running...' : 'Run all safe (GET)' }}
          </button>
          <button class="btn btn-secondary" @click="resetResults">Reset</button>
        </div>
      </div>

      <div class="toolbar">
        <input
          v-model="filter"
          type="search"
          class="form-input"
          placeholder="Filter by method, path or description..."
        />
        <label class="form-check">
          <input type="checkbox" v-model="onlyFailures" class="form-check-input" />
          <span>Only failures</span>
        </label>
      </div>

      <p class="summary" :class="summaryClass">
        {{ summaryText }}
      </p>

      <div v-for="(group, key) in filteredGroups" :key="key" class="category-card">
        <h3>
          {{ group.label }}
          <span class="group-count">{{ visibleEndpoints(group).length }}</span>
        </h3>
        <ul>
          <li v-for="ep in visibleEndpoints(group)" :key="ep.method + ep.path" class="endpoint-item">
            <div class="endpoint-head">
              <span class="method" :class="ep.method.toLowerCase()">{{ ep.method }}</span>
              <code class="path">{{ ep.path }}</code>
              <span v-if="ep.admin" class="tag admin">admin</span>
              <span v-if="ep.anon" class="tag anon">no auth</span>
              <span v-if="ep.danger" class="tag danger">destructive</span>
              <button class="btn btn-sm btn-primary send" @click="send(ep)">Send</button>
            </div>
            <div class="endpoint-desc">{{ ep.desc }}</div>
            <div v-if="ep.body" class="endpoint-body">
              <textarea
                v-model="bodies[ep.method + ep.path]"
                class="body-input"
                rows="3"
                spellcheck="false"
              ></textarea>
            </div>
            <div v-if="results[ep.method + ep.path]" class="result" :class="results[ep.method + ep.path].kind">
              <div class="result-head">
                <span class="status">{{ results[ep.method + ep.path].status }}</span>
                <span class="ms">{{ results[ep.method + ep.path].ms }} ms</span>
              </div>
              <pre class="result-body">{{ results[ep.method + ep.path].text }}</pre>
            </div>
          </li>
        </ul>
      </div>

      <p v-if="!Object.keys(filteredGroups).length" class="empty">No endpoint matches that filter.</p>
    </div>
  </MainLayout>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useToast } from 'vue-toastification'
import MainLayout from '@/layouts/MainLayout.vue'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import catalog from '@/data/sandboxEndpoints.json'

const authStore = useAuthStore()
const toast = useToast()

const filter = ref('')
const onlyFailures = ref(false)
const runningAll = ref(false)
const results = reactive({})
const bodies = reactive({})

for (const group of Object.values(catalog)) {
  for (const ep of group.endpoints) {
    if (ep.body) bodies[ep.method + ep.path] = ep.body
  }
}

const allEndpoints = Object.values(catalog).flatMap(g => g.endpoints)

const isAdminRequired = ep => ep.admin && !authStore.isAdmin
const resultKey = ep => ep.method + ep.path

const visibleEndpoints = group =>
  group.endpoints.filter(ep => {
    if (onlyFailures.value && results[resultKey(ep)]?.kind !== 'fail') return false
    const q = filter.value.trim().toLowerCase()
    if (!q) return true
    return (
      ep.method.toLowerCase().includes(q) ||
      ep.path.toLowerCase().includes(q) ||
      ep.desc.toLowerCase().includes(q)
    )
  })

const filteredGroups = computed(() => {
  const out = {}
  for (const [key, group] of Object.entries(catalog)) {
    if (visibleEndpoints(group).length) out[key] = group
  }
  return out
})

const counted = allEndpoints.filter(ep => results[resultKey(ep)])
const failed = counted.filter(ep => results[resultKey(ep)].kind === 'fail')

const summaryText = computed(() => {
  if (!counted.length) return 'No requests sent yet.'
  return `${counted.length} / ${allEndpoints.length} tested - ${failed.length} failed, ${
    counted.length - failed.length
  } succeeded.`
})

const summaryClass = computed(() => {
  if (!counted.length) return 'neutral'
  return failed.length ? 'failing' : 'passing'
})

function resolvePath(ep) {
  let path = ep.path
  for (const [name, placeholder] of Object.entries(ep.params || {})) {
    const fromEnv = ep.env?.[name]
    const value = fromEnv || placeholder
    path = path.replace(`:${name}`, encodeURIComponent(value))
  }
  return path
}

async function send(ep) {
  const k = resultKey(ep)
  results[k] = { status: 'running...', ms: 0, kind: 'pending', text: '' }

  const path = resolvePath(ep)
  const config = { method: ep.method.toLowerCase(), url: path }

  const rawBody = bodies[k]
  if (rawBody && rawBody.trim()) {
    try {
      config.data = JSON.parse(rawBody)
    } catch (e) {
      results[k] = {
        status: 'invalid JSON',
        ms: 0,
        kind: 'fail',
        text: e.message
      }
      toast.error(`${ep.method} ${ep.path}: request body is not valid JSON`)
      return
    }
  }

  const started = performance.now()
  try {
    const response = await api.request(config)
    const ms = Math.round(performance.now() - started)
    const text = JSON.stringify(response.data, null, 2)
    results[k] = {
      status: `${response.status} ${response.statusText || ''}`.trim(),
      ms,
      kind: 'pass',
      text: text.length > 4000 ? text.slice(0, 4000) + '\n... (truncated)' : text
    }
  } catch (error) {
    const ms = Math.round(performance.now() - started)
    const status = error.response
      ? `${error.response.status} ${error.response.statusText || ''}`.trim()
      : 'network error'
    const data = error.response?.data
    const text =
      data === undefined
        ? error.message
        : JSON.stringify(data, null, 2)
    results[k] = {
      status,
      ms,
      kind: 'fail',
      text: String(text).slice(0, 4000)
    }
  }
}

async function runAllSafe() {
  runningAll.value = true
  const safe = allEndpoints.filter(ep => ep.method === 'GET' && !ep.danger && !isAdminRequired(ep))
  for (const ep of safe) {
    await send(ep)
  }
  runningAll.value = false
  toast.success(`Finished ${safe.length} safe GET requests.`)
}

function resetResults() {
  for (const k of Object.keys(results)) delete results[k]
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables';

.sandbox-view {
  .view-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;

    h1 {
      margin: 0 0 0.25rem;
      font-size: 1.75rem;
      font-weight: 600;
    }

    .subtitle {
      margin: 0;
      color: var(--text-color-secondary);
    }
  }

  .header-actions {
    display: flex;
    gap: 0.5rem;
  }

  .toolbar {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;

    .form-input {
      flex: 1 1 320px;
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--surface-border);
      border-radius: var(--border-radius);
      background: var(--surface-ground);
      color: var(--text-color);
    }

    .form-check {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.875rem;
      color: var(--text-color);
    }
  }

  .summary {
    font-size: 0.875rem;
    padding: 0.5rem 0.75rem;
    border-radius: var(--border-radius);
    margin: 0 0 1rem;

    &.neutral {
      background: var(--surface-ground);
      color: var(--text-color-secondary);
    }

    &.passing {
      background: var(--green-100);
      color: var(--green-800);
    }

    &.failing {
      background: var(--red-100);
      color: var(--red-800);
    }
  }

  .category-card {
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    border-radius: var(--border-radius);
    margin-bottom: 1.5rem;
  }

  .category-card h3 {
    padding: 0.75rem 1rem;
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--primary-600);
    background: var(--primary-100);
    border-radius: var(--border-radius) var(--border-radius) 0 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .group-count {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--text-color-secondary);
    background: var(--surface-card);
    border-radius: 999px;
    padding: 0.1rem 0.5rem;
  }

  .category-card ul {
    list-style: none;
    padding: 0.5rem 1rem 1rem;
    margin: 0;
  }

  .endpoint-item {
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--surface-border);

    &:last-child {
      border-bottom: none;
    }
  }

  .endpoint-head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .method {
    font-family: monospace;
    font-size: 0.6875rem;
    font-weight: 700;
    padding: 0.15rem 0.4rem;
    border-radius: 3px;
    background: var(--surface-ground);
    color: var(--text-color-secondary);
    min-width: 3.4rem;
    text-align: center;

    &.get {
      background: var(--green-100);
      color: var(--green-800);
    }

    &.post {
      background: var(--blue-100, #dbeafe);
      color: var(--blue-800, #1e40af);
    }

    &.put {
      background: var(--yellow-100);
      color: var(--yellow-800);
    }

    &.delete {
      background: var(--red-100);
      color: var(--red-800);
    }
  }

  .path {
    font-size: 0.8125rem;
    color: var(--text-color);
    word-break: break-all;
  }

  .tag {
    font-size: 0.625rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    padding: 0.1rem 0.35rem;
    border-radius: 3px;
    background: var(--surface-ground);
    color: var(--text-color-secondary);

    &.danger {
      background: var(--red-100);
      color: var(--red-800);
    }
  }

  .send {
    margin-left: auto;
  }

  .endpoint-desc {
    font-size: 0.8125rem;
    color: var(--text-color-secondary);
    margin-top: 0.25rem;
  }

  .endpoint-body {
    margin-top: 0.5rem;
  }

  .body-input {
    width: 100%;
    font-family: monospace;
    font-size: 0.75rem;
    padding: 0.5rem;
    border: 1px solid var(--surface-border);
    border-radius: var(--border-radius);
    background: var(--surface-ground);
    color: var(--text-color);
    resize: vertical;
  }

  .result {
    margin-top: 0.5rem;
    border-radius: var(--border-radius);
    padding: 0.5rem 0.75rem;
    font-size: 0.8125rem;

    &.pass {
      background: var(--green-100);
      color: var(--green-800);
    }

    &.fail {
      background: var(--red-100);
      color: var(--red-800);
    }

    &.pending {
      background: var(--surface-ground);
      color: var(--text-color-secondary);
    }
  }

  .result-head {
    display: flex;
    justify-content: space-between;
    font-weight: 600;
    margin-bottom: 0.35rem;
  }

  .result-body {
    margin: 0;
    font-family: monospace;
    font-size: 0.75rem;
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 18rem;
    overflow: auto;
  }

  .empty {
    color: var(--text-color-secondary);
    font-size: 0.875rem;
  }
}
</style>
