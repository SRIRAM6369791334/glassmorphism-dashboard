import { useState, useMemo } from 'react'
import { COMPONENT_REGISTRY, type ComponentCategory } from '@/registry'

export function ComponentsGalleryPage() {
  const [selectedCategory, setSelectedCategory] = useState<ComponentCategory>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [expandedCodeId, setExpandedCodeId] = useState<string | null>(null)

  const categories: { key: ComponentCategory; label: string; count: number }[] = useMemo(() => {
    return [
      { key: 'all', label: 'All Components', count: COMPONENT_REGISTRY.length },
      {
        key: 'buttons',
        label: 'Buttons',
        count: COMPONENT_REGISTRY.filter((c) => c.category === 'buttons').length,
      },
      {
        key: 'fields',
        label: 'Inputs & Fields',
        count: COMPONENT_REGISTRY.filter((c) => c.category === 'fields').length,
      },
      {
        key: 'effects',
        label: 'Effects & Cards',
        count: COMPONENT_REGISTRY.filter((c) => c.category === 'effects').length,
      },
      {
        key: 'springs',
        label: 'Spring Physics',
        count: COMPONENT_REGISTRY.filter((c) => c.category === 'springs').length,
      },
      {
        key: 'typography',
        label: 'Typography',
        count: COMPONENT_REGISTRY.filter((c) => c.category === 'typography').length,
      },
    ]
  }, [])

  const filteredComponents = useMemo(() => {
    return COMPONENT_REGISTRY.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory
      const query = searchQuery.trim().toLowerCase()
      if (!query) return matchesCategory

      const matchesSearch =
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.tamilDescription.toLowerCase().includes(query) ||
        item.tags.some((tag) => tag.toLowerCase().includes(query))

      return matchesCategory && matchesSearch
    })
  }, [selectedCategory, searchQuery])

  const handleCopyCode = async (id: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // Clipboard fallback
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,#181124_0%,#09060f_100%)] text-white px-4 py-8 sm:px-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        {/* Navigation Bar */}
        <header className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <a
              href="#"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono font-medium text-purple-300 bg-white/5 border border-white/10 backdrop-blur-md transition-all hover:bg-white/10 hover:text-white"
            >
              ← Back to Login Screen
            </a>
            <span className="hidden sm:inline-block px-3 py-1 rounded-full text-[11px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Total Components: {COMPONENT_REGISTRY.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-white/50">
              Future components auto-sync via <code className="text-purple-300">src/registry</code>
            </span>
          </div>
        </header>

        {/* Hero Section */}
        <section className="flex flex-col gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 w-fit rounded-full text-xs font-mono bg-white/5 border border-white/10 text-purple-300">
            <span>✨ Live Component Gallery</span>
            <span className="size-1 rounded-full bg-purple-400" />
            <span>கூறுகளின் அரங்கம்</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-white/90 to-purple-300 bg-clip-text text-transparent">
            Glassmorphic UI Design System
          </h1>
          <p className="text-sm sm:text-base text-white/70 max-w-2xl leading-relaxed">
            எங்கள் திட்டத்தில் உள்ள அனைத்து Glassmorphic &amp; Spring Physics கூறுகளின் நேரடிப் பயன்பாட்டு அரங்கம். புதிய கூறுகளைச் சேர்க்கும்போது அவை தானாகவே இங்கே பட்டியலிடப்படும்.
          </p>
        </section>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((cat) => {
              const active = selectedCategory === cat.key
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
                    active
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 border border-purple-400'
                      : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {cat.label} ({cat.count})
                </button>
              )
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search components or tags..."
              className="w-full px-3.5 py-2 pl-9 rounded-xl text-xs font-mono text-white bg-white/5 border border-white/10 placeholder:text-white/30 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition-all"
            />
            <svg
              className="absolute left-3 top-2.5 size-3.5 text-white/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Components Grid */}
        {filteredComponents.length === 0 ? (
          <div className="py-16 text-center rounded-2xl border border-white/10 bg-white/[0.02]">
            <p className="text-base text-white/70">No components match your search criteria.</p>
            <p className="text-xs text-white/40 mt-1">Try searching for &quot;button&quot;, &quot;glass&quot;, &quot;spring&quot;, or &quot;field&quot;.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('all')
              }}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-mono text-purple-300 bg-white/5 border border-white/10 hover:bg-white/10"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredComponents.map((item) => {
              const isExpanded = expandedCodeId === item.id
              const isCopied = copiedId === item.id

              return (
                <div
                  key={item.id}
                  className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-xl overflow-hidden transition-all duration-200 hover:border-purple-500/40 hover:shadow-2xl hover:shadow-purple-900/10"
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-white/10 flex items-start justify-between gap-3 bg-white/[0.01]">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-white tracking-wide">
                          {item.name}
                        </h2>
                        {item.badge && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-white/40 block mt-0.5">
                        {item.categoryLabel}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyCode(item.id, item.codeSnippet)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all border border-white/10 bg-white/5 text-white/80 hover:bg-white/15 hover:text-white flex items-center gap-1.5"
                    >
                      {isCopied ? (
                        <>
                          <svg className="size-3 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <svg className="size-3 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Card Description */}
                  <div className="px-4 py-3 border-b border-white/[0.06] bg-black/10">
                    <p className="text-xs text-white/80 leading-relaxed font-sans">{item.description}</p>
                    <p className="text-[11px] text-white/50 mt-1 font-sans italic">{item.tamilDescription}</p>
                  </div>

                  {/* Interactive Live Preview Area */}
                  <div className="p-5 flex-1 min-h-[140px] flex items-center justify-center bg-black/25">
                    {item.renderPreview()}
                  </div>

                  {/* Code Drawer Footer */}
                  <div className="border-t border-white/10 bg-black/30">
                    <button
                      type="button"
                      onClick={() => setExpandedCodeId(isExpanded ? null : item.id)}
                      className="w-full px-4 py-2 text-left text-[11px] font-mono text-purple-300 hover:text-purple-200 flex items-center justify-between transition-colors"
                    >
                      <span>{isExpanded ? '▼ Hide Usage Code' : '▶ View Usage Code'}</span>
                      <span className="text-[10px] text-white/30">TSX</span>
                    </button>

                    {isExpanded && (
                      <div className="p-3 border-t border-white/10 bg-black/60 overflow-x-auto text-[11px] font-mono text-purple-200">
                        <pre className="whitespace-pre">{item.codeSnippet}</pre>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Future Expansion Architecture Notice */}
        <footer className="mt-8 p-6 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>🚀 Future Component Architecture</span>
              <span className="size-1.5 rounded-full bg-emerald-400" />
            </h3>
            <p className="text-xs text-white/60">
              எதிர்காலத்தில் நீங்கள் அல்லது ஏஜென்ட் ஏதேனும் புதிய component உருவாக்கினால், <code className="text-purple-300 bg-white/5 px-1 py-0.5 rounded">src/registry/components.tsx</code> கோப்பில் சேர்த்தால் போதும். அது உடனடியாக இந்த கேலரியில் தேடுதல், ஃபில்டர் மற்றும் Live Preview-வுடன் தோன்றும்.
            </p>
          </div>
          <a
            href="#"
            className="px-4 py-2 rounded-xl text-xs font-mono font-medium text-white bg-purple-600 hover:bg-purple-500 transition-colors shadow-lg shadow-purple-600/30 whitespace-nowrap"
          >
            Go to Login Form
          </a>
        </footer>
      </div>
    </div>
  )
}

export default ComponentsGalleryPage
