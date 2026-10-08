import { useState } from 'react'

// Fields
import { GlassField } from '@/components/ui/fields/GlassField'
import { PasswordField } from '@/components/ui/fields/PasswordField'
import { FloatingField } from '@/components/ui/fields/FloatingField'

// Springs
import { SpringSelect } from '@/components/ui/select/SpringSelect'
import { SpringSlider } from '@/components/ui/slider/SpringSlider'
import { SpringAccordion } from '@/components/ui/accordion/SpringAccordion'

export function SpringSelectPreview() {
  const [val, setVal] = useState('pro')
  const options = [
    { value: 'starter', label: 'Starter Tier — Free' },
    { value: 'pro', label: 'Pro Glass — $29/mo' },
    { value: 'enterprise', label: 'Enterprise — Custom' },
  ]
  return (
    <div className="w-full max-w-[280px]">
      <SpringSelect
        options={options}
        value={val}
        onChange={(next) => setVal(next)}
        searchable={false}
        magnet={true}
      />
    </div>
  )
}

export function SpringSliderPreview() {
  const [val, setVal] = useState(65)
  return (
    <div className="w-full max-w-[280px]">
      <SpringSlider
        value={val}
        onChange={(next) => setVal(next)}
        min={0}
        max={100}
        step={1}
        size={26}
        label="Intensity"
        showValue={true}
      />
    </div>
  )
}

export function SpringAccordionPreview() {
  const items = [
    {
      id: 'item-1',
      title: 'Euler Spring Physics',
      content: 'Uses dynamic spring stiffness and damping to expand and collapse smoothly.',
    },
    {
      id: 'item-2',
      title: 'Zero Layout Jitter',
      content: 'Calculates continuous scroll height without clipping or layout jumping.',
    },
  ]
  return (
    <div className="w-full rounded-xl bg-white/[0.03] p-2 border border-white/10">
      <SpringAccordion items={items} type="single" defaultValue="item-1" />
    </div>
  )
}

export function PasswordFieldPreview() {
  const [pass, setPass] = useState('SecretPass123!')
  return (
    <div className="w-full max-w-[280px]">
      <PasswordField
        label="Password"
        value={pass}
        onChange={(e) => setPass(e.target.value)}
      />
    </div>
  )
}

export function FloatingFieldPreview() {
  const [name, setName] = useState('')
  return (
    <div className="w-full max-w-[280px]">
      <FloatingField
        label="Full Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
    </div>
  )
}

export function GlassFieldPreview() {
  const [email, setEmail] = useState('user@glassmorphism.io')
  return (
    <div className="w-full max-w-[280px]">
      <GlassField
        label="Email Address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        icon="mail"
      />
    </div>
  )
}
