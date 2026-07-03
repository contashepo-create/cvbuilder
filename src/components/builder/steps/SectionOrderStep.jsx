import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { GripVertical, Eye, EyeOff, Edit2, Plus, Trash2, Check, X } from 'lucide-react'
import { SECTION_TYPES, DEFAULT_SECTION_ORDER } from '../../../constants/sections'
import { useSectionStore, DEFAULT_LABELS, CUSTOM_SECTION_TYPES } from '../../../store/sectionStore'

export default function SectionOrderStep({ content, onChange }) {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === 'ar'
  const {
    removeSection, restoreSection, renameSection,
    reorderSections, addCustomSection, getSectionLabel, isSectionVisible,
  } = useSectionStore()

  const sectionOrder = content?.sectionOrder || DEFAULT_SECTION_ORDER
  const hiddenSections = content?.hiddenSections || {}
  const hiddenIds = Object.keys(hiddenSections).filter(id => hiddenSections[id])

  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [showAddCustom, setShowAddCustom] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState('text')

  const onDragEnd = (result) => {
    if (!result.destination) return
    const reordered = [...sectionOrder]
    const [moved] = reordered.splice(result.source.index, 1)
    reordered.splice(result.destination.index, 0, moved)
    onChange(reorderSections(content, reordered))
  }

  const handleRemove = (sectionId) => {
    if (!confirm(isAr ? `إخفاء قسم "${getSectionLabel(sectionId, content, isAr ? 'ar' : 'en')}"؟` : `Hide section "${getSectionLabel(sectionId, content, 'en')}"?`)) return
    onChange(removeSection(content, sectionId))
  }

  const handleRestore = (sectionId) => {
    onChange(restoreSection(content, sectionId))
  }

  const handleStartEdit = (sectionId) => {
    const label = getSectionLabel(sectionId, content, isAr ? 'ar' : 'en')
    setEditTitle(label)
    setEditingId(sectionId)
  }

  const handleSaveEdit = () => {
    if (editTitle.trim()) {
      onChange(renameSection(content, editingId, editTitle.trim()))
    }
    setEditingId(null)
    setEditTitle('')
  }

  const handleAddCustom = () => {
    if (!newTitle.trim()) return
    const updated = addCustomSection(content, newTitle.trim(), newType)
    onChange(updated)
    setNewTitle('')
    setNewType('text')
    setShowAddCustom(false)
  }

  const getSectionIcon = (sectionId) => {
    if (sectionId.startsWith('custom_')) return '📌'
    const section = SECTION_TYPES[sectionId]
    if (!section) return '📄'
    const icons = { User: '👤', FileText: '📝', Briefcase: '💼', GraduationCap: '🎓', Wrench: '🔧', Globe: '🌍', Award: '🏆', FolderGit2: '📂' }
    return icons[section.icon] || '📄'
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{isAr ? 'اسحب وأفلت لإعادة ترتيب الأقسام. يمكنك إخفاء أو إعادة تسمية أو إضافة أقسام جديدة.' : 'Drag and drop to reorder. You can hide, rename, or add custom sections.'}</p>

      {/* Active sections (draggable) */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="sections">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
              {sectionOrder.map((sectionId, index) => {
                const section = SECTION_TYPES[sectionId]
                const isCustom = sectionId.startsWith('custom_')
                const label = getSectionLabel(sectionId, content, isAr ? 'ar' : 'en')
                const canRemove = sectionId !== 'personalInfo'

                return (
                  <Draggable key={sectionId} draggableId={sectionId} index={index}>
                    {(prov, snapshot) => (
                      <div
                        ref={prov.innerRef}
                        {...prov.draggableProps}
                        {...prov.dragHandleProps}
                        className={`flex items-center gap-3 p-3 rounded-lg border bg-white transition-shadow ${
                          snapshot.isDragging ? 'border-primary-400 shadow-md' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <GripVertical size={20} className="text-gray-400 cursor-grab" />

                        {/* Icon */}
                        <span className="text-lg">{getSectionIcon(sectionId)}</span>

                        {/* Title (editable) */}
                        {editingId === sectionId ? (
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit() }}
                              className="input text-sm py-1"
                              autoFocus
                              maxLength={50}
                            />
                            <button onClick={handleSaveEdit} className="text-green-600 hover:text-green-700"><Check size={18} /></button>
                            <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                          </div>
                        ) : (
                          <span className="flex-1 font-medium text-sm">{label}</span>
                        )}

                        {/* Badges */}
                        {section?.required && <span className="badge bg-red-50 text-red-600 text-xs">{isAr ? 'إلزامي' : 'Required'}</span>}
                        {isCustom && <span className="badge bg-purple-50 text-purple-600 text-xs">{isAr ? 'مخصص' : 'Custom'}</span>}

                        {/* Actions */}
                        {editingId !== sectionId && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleStartEdit(sectionId)}
                              className="p-1 text-gray-400 hover:text-blue-600"
                              title={isAr ? 'إعادة تسمية' : 'Rename'}
                            >
                              <Edit2 size={14} />
                            </button>
                            {canRemove && (
                              <button
                                onClick={() => handleRemove(sectionId)}
                                className="p-1 text-gray-400 hover:text-red-600"
                                title={isAr ? 'إخفاء' : 'Hide'}
                              >
                                <EyeOff size={14} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                )
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Add custom section */}
      {showAddCustom ? (
        <div className="p-4 rounded-lg border-2 border-dashed border-primary-300 bg-primary-50/30 space-y-3">
          <h4 className="text-sm font-medium text-primary-700">{isAr ? 'قسم جديد' : 'New Section'}</h4>
          <div>
            <label className="label">{isAr ? 'اسم القسم' : 'Section name'}</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && newTitle.trim()) handleAddCustom() }}
              className="input"
              placeholder={isAr ? 'مثال: الأنشطة، التطوع، الهوايات...' : 'e.g. Activities, Volunteering, Hobbies...'}
              autoFocus
              maxLength={50}
            />
          </div>
          <div>
            <label className="label">{isAr ? 'نوع المحتوى' : 'Content type'}</label>
            <select value={newType} onChange={(e) => setNewType(e.target.value)} className="input">
              {CUSTOM_SECTION_TYPES.map(ct => (
                <option key={ct.id} value={ct.id}>{isAr ? ct.label_ar : ct.label_en}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAddCustom} disabled={!newTitle.trim()} className="btn-primary text-sm">
              <Plus size={16} /> {isAr ? 'إضافة' : 'Add'}
            </button>
            <button onClick={() => { setShowAddCustom(false); setNewTitle('') }} className="btn-secondary text-sm">
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddCustom(true)}
          className="btn-outline w-full text-sm"
        >
          <Plus size={18} /> {isAr ? 'إضافة قسم مخصص' : 'Add custom section'}
        </button>
      )}

      {/* Hidden sections */}
      {hiddenIds.length > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-gray-50 border border-gray-200">
          <p className="text-xs text-gray-500 mb-2">{isAr ? 'أقسام مخفية (اضغط للاستعادة)' : 'Hidden sections (click to restore)'}</p>
          <div className="flex flex-wrap gap-2">
            {hiddenIds.map(id => (
              <button
                key={id}
                onClick={() => handleRestore(id)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-gray-200 text-xs text-gray-600 hover:border-primary-300 hover:text-primary-600 transition-colors"
              >
                <Eye size={12} />
                {getSectionLabel(id, content, isAr ? 'ar' : 'en')}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
