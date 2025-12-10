<script setup lang="ts">
import { computed, watch, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import type { RichtextFieldDefinition } from '../../types'

interface Props {
  modelValue: string
  field: RichtextFieldDefinition
  fieldName: string
  disabled?: boolean
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const label = computed(() => props.field.label || props.fieldName)
const help = computed(() => props.field.help || '')
const required = computed(() => props.field.required || false)

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Link.configure({ openOnClick: false }),
    Image,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Underline,
    Placeholder.configure({ placeholder: props.field.placeholder || 'Start writing...' })
  ],
  editable: !props.disabled,
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  }
})

watch(() => props.modelValue, (newValue) => {
  if (editor.value && newValue !== editor.value.getHTML()) {
    editor.value.commands.setContent(newValue, false)
  }
})

watch(() => props.disabled, (disabled) => {
  editor.value?.setEditable(!disabled)
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})

const toolbarButtons = [
  { action: 'bold', icon: 'B', title: 'Bold', svg: false },
  { action: 'italic', icon: 'I', title: 'Italic', svg: false },
  { action: 'underline', icon: 'U', title: 'Underline', svg: false },
  { action: 'strike', icon: 'S', title: 'Strikethrough', svg: false },
  { action: 'heading-1', icon: 'H1', title: 'Heading 1', svg: false },
  { action: 'heading-2', icon: 'H2', title: 'Heading 2', svg: false },
  { action: 'bulletList', icon: '•', title: 'Bullet List', svg: false },
  { action: 'orderedList', icon: '1.', title: 'Ordered List', svg: false },
  { action: 'blockquote', icon: '"', title: 'Quote', svg: false },
  { action: 'link', icon: 'link', title: 'Link', svg: true }
]

function executeAction(action: string) {
  if (!editor.value) return

  switch (action) {
    case 'bold':
      editor.value.chain().focus().toggleBold().run()
      break
    case 'italic':
      editor.value.chain().focus().toggleItalic().run()
      break
    case 'underline':
      editor.value.chain().focus().toggleUnderline().run()
      break
    case 'strike':
      editor.value.chain().focus().toggleStrike().run()
      break
    case 'heading-1':
      editor.value.chain().focus().toggleHeading({ level: 1 }).run()
      break
    case 'heading-2':
      editor.value.chain().focus().toggleHeading({ level: 2 }).run()
      break
    case 'bulletList':
      editor.value.chain().focus().toggleBulletList().run()
      break
    case 'orderedList':
      editor.value.chain().focus().toggleOrderedList().run()
      break
    case 'blockquote':
      editor.value.chain().focus().toggleBlockquote().run()
      break
    case 'link':
      const url = window.prompt('Enter URL')
      if (url) {
        editor.value.chain().focus().setLink({ href: url }).run()
      }
      break
  }
}

function isActive(action: string): boolean {
  if (!editor.value) return false

  switch (action) {
    case 'bold': return editor.value.isActive('bold')
    case 'italic': return editor.value.isActive('italic')
    case 'underline': return editor.value.isActive('underline')
    case 'strike': return editor.value.isActive('strike')
    case 'heading-1': return editor.value.isActive('heading', { level: 1 })
    case 'heading-2': return editor.value.isActive('heading', { level: 2 })
    case 'bulletList': return editor.value.isActive('bulletList')
    case 'orderedList': return editor.value.isActive('orderedList')
    case 'blockquote': return editor.value.isActive('blockquote')
    case 'link': return editor.value.isActive('link')
    default: return false
  }
}
</script>

<template>
  <div class="cms-field">
    <label v-if="label" class="cms-field__label">
      {{ label }}
      <span v-if="required" class="cms-field__required">*</span>
    </label>
    <div class="richtext-editor">
      <!-- Toolbar -->
      <div class="richtext-editor__toolbar">
        <button
          v-for="btn in toolbarButtons"
          :key="btn.action"
          type="button"
          :title="btn.title"
          :class="[
            'richtext-editor__btn',
            isActive(btn.action) ? 'richtext-editor__btn--active' : ''
          ]"
          :disabled="disabled"
          @click="executeAction(btn.action)"
        >
          <svg v-if="btn.svg && btn.icon === 'link'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="richtext-editor__icon">
            <path d="M12.232 4.232a2.5 2.5 0 0 1 3.536 3.536l-1.225 1.224a.75.75 0 0 0 1.061 1.06l1.224-1.224a4 4 0 0 0-5.656-5.656l-3 3a4 4 0 0 0 .225 5.865.75.75 0 0 0 .977-1.138 2.5 2.5 0 0 1-.142-3.667l3-3Z" />
            <path d="M11.603 7.963a.75.75 0 0 0-.977 1.138 2.5 2.5 0 0 1 .142 3.667l-3 3a2.5 2.5 0 0 1-3.536-3.536l1.225-1.224a.75.75 0 0 0-1.061-1.06l-1.224 1.224a4 4 0 1 0 5.656 5.656l3-3a4 4 0 0 0-.225-5.865Z" />
          </svg>
          <template v-else>{{ btn.icon }}</template>
        </button>
      </div>

      <!-- Editor -->
      <EditorContent
        :editor="editor"
        :class="[
          'richtext-editor__content',
          { 'richtext-editor__content--disabled': disabled }
        ]"
        :style="{
          minHeight: field.minHeight ? `${field.minHeight}px` : '200px',
          maxHeight: field.maxHeight ? `${field.maxHeight}px` : undefined,
          overflowY: field.maxHeight ? 'auto' : undefined
        }"
      />
    </div>
    <p v-if="help && !error" class="cms-field__help">{{ help }}</p>
    <p v-if="error" class="cms-field__error">{{ error }}</p>
  </div>
</template>

<style>
/* CMS Field Wrapper */
.cms-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cms-field__label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.cms-field__required {
  color: #dc2626;
  margin-left: 2px;
}

.cms-field__help {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
}

.cms-field__error {
  font-size: 13px;
  color: #dc2626;
  margin: 0;
}

/* Richtext Editor */
.richtext-editor {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  overflow: hidden;
  background-color: white;
}

.richtext-editor__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.richtext-editor__btn {
  padding: 4px 8px;
  font-size: 14px;
  border-radius: 4px;
  color: #374151;
  transition: background-color 0.15s ease, color 0.15s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.richtext-editor__icon {
  width: 16px;
  height: 16px;
}

.richtext-editor__btn:hover {
  background-color: #e5e7eb;
}

.richtext-editor__btn--active {
  background-color: #dbeafe;
  color: #2563eb;
}

.richtext-editor__content {
  padding: 16px;
}

.richtext-editor__content--disabled {
  opacity: 0.5;
  pointer-events: none;
}

.richtext-editor__content .ProseMirror {
  outline: none;
  min-height: 100px;
  color: #111827;
}

.ProseMirror p.is-editor-empty:first-child::before {
  color: #9ca3af;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

/* Prose styles */
.richtext-editor__content .ProseMirror h1 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 16px;
}

.richtext-editor__content .ProseMirror h2 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 12px;
}

.richtext-editor__content .ProseMirror p {
  margin-bottom: 12px;
}

.richtext-editor__content .ProseMirror ul,
.richtext-editor__content .ProseMirror ol {
  margin-bottom: 12px;
  padding-left: 24px;
}

.richtext-editor__content .ProseMirror blockquote {
  border-left: 3px solid #d1d5db;
  padding-left: 16px;
  margin: 16px 0;
  color: #6b7280;
}

</style>
