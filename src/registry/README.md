# Component Registry Architecture

This directory defines the centralized component registry for the Glassmorphism project design system.

## How to Add Any Future Component

Whenever you create a new component in `src/components/`, follow these simple steps to make it automatically visible in the **Component Gallery** (`#/components`):

1. **Create your component** under `src/components/ui/<category>/<ComponentName>/` or `src/components/effects/<ComponentName>/`.
2. **Open `src/registry/components.tsx`** and import your component.
3. **Add an entry to `COMPONENT_REGISTRY`**:

```tsx
{
  id: 'my-new-component',
  name: 'MyNewComponent',
  category: 'buttons', // 'buttons' | 'fields' | 'effects' | 'springs' | 'typography'
  categoryLabel: 'Buttons',
  badge: 'Core UI',
  description: 'Clean English description of what it does.',
  tamilDescription: 'சுருக்கமான தமிழ் விளக்கம்.',
  tags: ['button', 'glass', 'new'],
  renderPreview: () => (
    <MyNewComponent>Live Interactive Demo</MyNewComponent>
  ),
  codeSnippet: `import { MyNewComponent } from '@/components/...'

<MyNewComponent>Demo</MyNewComponent>`,
}
```

4. **Done!** The component will immediately:
   - Appear in the Component Gallery at `http://localhost:5173/#/components`.
   - Support category filtering.
   - Support live search by name, description, and tags.
   - Provide an interactive preview and one-click "Copy Code" button.
