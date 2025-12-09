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
  { action: 'bold', icon: 'B', title: 'Bold' },
  { action: 'italic', icon: 'I', title: 'Italic' },
  { action: 'underline', icon: 'U', title: 'Underline' },
  { action: 'strike', icon: 'S', title: 'Strikethrough' },
  { action: 'heading-1', icon: 'H1', title: 'Heading 1' },
  { action: 'heading-2', icon: 'H2', title: 'Heading 2' },
  { action: 'bulletList', icon: '•', title: 'Bullet List' },
  { action: 'orderedList', icon: '1.', title: 'Ordered List' },
  { action: 'blockquote', icon: '"', title: 'Quote' },
  { action: 'link', icon: '🔗', title: 'Link' }
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
  <UFormField
    :label="label"
    :required="required"
    :help="help"
    :error="error"
  >
    <div class="border border-gray-300 rounded-lg overflow-hidden">
      <!-- Toolbar -->
      <div class="flex flex-wrap gap-1 p-2 bg-gray-50 border-b border-gray-200">
        <button
          v-for="btn in toolbarButtons"
          :key="btn.action"
          type="button"
          :title="btn.title"
          :class="[
            'px-2 py-1 text-sm rounded hover:bg-gray-200 transition-colors',
            isActive(btn.action) ? 'bg-gray-200 text-blue-600' : 'text-gray-700'
          ]"
          :disabled="disabled"
          @click="executeAction(btn.action)"
        >
          {{ btn.icon }}
        </button>
      </div>

      <!-- Editor -->
      <EditorContent
        :editor="editor"
        :class="[
          'prose prose-sm max-w-none p-4',
          { 'min-h-[200px]': !field.minHeight },
          { 'opacity-50': disabled }
        ]"
        :style="{
          minHeight: field.minHeight ? `${field.minHeight}px` : undefined,
          maxHeight: field.maxHeight ? `${field.maxHeight}px` : undefined,
          overflowY: field.maxHeight ? 'auto' : undefined
        }"
      />
    </div>
  </UFormField>
</template>

<style>
.ProseMirror {
  outline: none;
}
.ProseMirror p.is-editor-empty:first-child::before {
  color: #adb5bd;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}
</style>
