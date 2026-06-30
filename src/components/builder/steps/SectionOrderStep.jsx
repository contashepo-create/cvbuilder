import { useTranslation } from 'react-i18next'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { GripVertical } from 'lucide-react'
import { SECTION_TYPES } from '../../../constants/sections'

export default function SectionOrderStep({ sectionOrder, onChange }) {
  const { t } = useTranslation()

  const onDragEnd = (result) => {
    if (!result.destination) return
    const reordered = [...sectionOrder]
    const [moved] = reordered.splice(result.source.index, 1)
    reordered.splice(result.destination.index, 0, moved)
    onChange(reordered)
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">{t('builder.fields.section_order_desc')}</p>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="sections">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
              {sectionOrder.map((sectionId, index) => {
                const section = SECTION_TYPES[sectionId]
                if (!section) return null
                return (
                  <Draggable key={sectionId} draggableId={sectionId} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`flex items-center gap-3 p-3 rounded-lg border bg-white transition-shadow ${
                          snapshot.isDragging
                            ? 'border-primary-400 shadow-md'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <GripVertical size={20} className="text-gray-400" />
                        <span className="flex-1 font-medium">
                          {t(`builder.sections.${section.key}`)}
                        </span>
                        {section.required ? (
                          <span className="badge bg-red-50 text-red-600">
                            {t('common.required')}
                          </span>
                        ) : (
                          <span className="badge bg-gray-100 text-gray-500">
                            {t('common.optional')}
                          </span>
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
    </div>
  )
}
