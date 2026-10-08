import { useState } from 'react'
import { IsometricButton } from '@/components/ui/button/IsometricButton'
import { LiquidGlass } from '@/components/effects/LiquidGlass'
import { Magnet } from '@/components/effects/Magnet'
import { SpringSelect } from '@/components/ui/select/SpringSelect'
import { SpringSlider } from '@/components/ui/slider/SpringSlider'
import { SpringAccordion } from '@/components/ui/accordion/SpringAccordion'

export function DesignPassExamples() {
  const [selectValue, setSelectValue] = useState('pro')
  const [sliderValue, setSliderValue] = useState(65)

  const selectOptions = [
    { value: 'starter', label: 'Starter Tier — Free' },
    { value: 'pro', label: 'Pro Glass — $29/mo' },
    { value: 'enterprise', label: 'Enterprise Suite — Custom' },
  ]

  const accordionItems = [
    {
      id: 'isometric',
      title: 'What makes IsometricButton unique?',
      content:
        'It uses pure CSS 3D transforms, layer stacking, and floor reflections with dynamic linear() spring curves. No heavy canvas or WebGL required.',
    },
    {
      id: 'liquid-glass',
      title: 'How does LiquidGlass achieve physical refraction?',
      content:
        'It calculates Snell’s law ray deviations into a baked SVG displacement map filter on Chromium, with smooth WebGL texture sampling fallbacks elsewhere.',
    },
    {
      id: 'springs',
      title: 'How do the Spring controls behave?',
      content:
        'SpringSelect and SpringSlider integrate Euler spring velocity integrators so dropdowns bounce, thumbs squash on velocity, and panels open naturally.',
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '2rem', maxWidth: '800px', margin: '0 auto', color: '#fff' }}>
      {/* 1. IsometricButton Example */}
      <section>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: '#a855f7' }}>
          1. IsometricButton
        </h3>
        <div style={{ height: '100px', display: 'flex', alignItems: 'center' }}>
          <IsometricButton
            wrapperClassName="w-48 h-12"
            settings={{
              glowColor: '#a855f7',
              textColor: '#ffffff',
              fontSize: '1rem',
            }}
            onClick={() => alert('Isometric button pressed!')}
          >
            Launch Console
          </IsometricButton>
        </div>
      </section>

      {/* 2. LiquidGlass & Magnet Example */}
      <section>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: '#38bdf8' }}>
          2. LiquidGlass & Magnet
        </h3>
        <LiquidGlass
          radius={24}
          bezel={14}
          depth={48}
          refraction={1.4}
          magnify={1.15}
          elastic={true}
          magnet={true}
          className="p-6 max-w-md border border-white/10"
        >
          <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 600 }}>Refractive Glass Shell</h4>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)' }}>
            This panel squishes like jelly when pressed and leans toward the cursor with magnetic physics.
          </p>
        </LiquidGlass>
      </section>

      {/* 3. Magnet Standalone Example */}
      <section>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: '#10b981' }}>
          3. Standalone Magnet
        </h3>
        <Magnet
          radius={2}
          pullFactor={0.35}
          tiltStrength={10}
          glare={true}
          wrapperClassName="inline-block"
        >
          <div style={{ padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.06)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
            Hover me to feel magnetic pull &amp; 3D specular glare
          </div>
        </Magnet>
      </section>

      {/* 4. SpringSelect Example */}
      <section>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: '#f59e0b' }}>
          4. SpringSelect
        </h3>
        <div style={{ maxWidth: '320px' }}>
          <SpringSelect
            options={selectOptions}
            value={selectValue}
            onChange={(val) => setSelectValue(val)}
            searchable={false}
            magnet={true}
          />
        </div>
      </section>

      {/* 5. SpringSlider Example */}
      <section>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: '#ec4899' }}>
          5. SpringSlider
        </h3>
        <div style={{ maxWidth: '380px' }}>
          <SpringSlider
            value={sliderValue}
            onChange={(val) => setSliderValue(val)}
            min={0}
            max={100}
            step={1}
            size={28}
            label="Intensity"
            showValue={true}
          />
        </div>
      </section>

      {/* 6. SpringAccordion Example */}
      <section>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: '#6366f1' }}>
          6. SpringAccordion
        </h3>
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '1rem', border: '1px solid rgba(255,255,255,0.08)' }}>
          <SpringAccordion items={accordionItems} type="single" defaultValue="isometric" />
        </div>
      </section>
    </div>
  )
}

export default DesignPassExamples
