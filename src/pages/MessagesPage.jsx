import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../store/authStore'
import { useAdStore } from '../store/adStore'
import { ArrowLeft, Send, MessageCircle, Lock, Plus, Check } from 'lucide-react'
import Spinner from '../components/ui/Spinner'

export default function MessagesPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const isAr = i18n.language === 'ar'
  const { user } = useAuthStore()
  const {
    conversations, fetchUserConversations,
    conversationMessages, fetchConversationMessages,
    createConversation, sendConversationMessage, markMessagesRead,
  } = useAdStore()

  const [selectedConv, setSelectedConv] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newSubject, setNewSubject] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (user) {
      fetchUserConversations(user.id).finally(() => setLoading(false))
    }
  }, [user])

  // Poll for new messages every 10 seconds
  useEffect(() => {
    if (!selectedConv) return
    const interval = setInterval(() => {
      fetchConversationMessages(selectedConv.id)
    }, 10000)
    return () => clearInterval(interval)
  }, [selectedConv])

  useEffect(() => {
    if (selectedConv) {
      fetchConversationMessages(selectedConv.id)
      markMessagesRead(selectedConv.id, 'user')
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [selectedConv])

  const handleSelectConv = (conv) => {
    setSelectedConv(conv)
    setReplyText('')
  }

  const handleReply = async () => {
    if (!replyText.trim() || !selectedConv) return
    if (selectedConv.status === 'closed') return
    setSending(true)
    try {
      await sendConversationMessage(selectedConv.id, replyText.trim(), 'user', user.id)
      setReplyText('')
      // Refresh conversations list
      fetchUserConversations(user.id)
    } catch (err) {
      alert(err.message)
    } finally {
      setSending(false)
    }
  }

  const handleNewConversation = async () => {
    if (!newSubject.trim() || !newMessage.trim()) return
    setSending(true)
    try {
      await createConversation(user.id, newSubject.trim(), newMessage.trim(), 'user')
      setNewSubject('')
      setNewMessage('')
      setShowNewForm(false)
      fetchUserConversations(user.id)
    } catch (err) {
      alert(err.message)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size={32} /></div>
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <button onClick={() => navigate('/dashboard')} className="btn-outline text-sm mb-4">
        <ArrowLeft size={16} /> {isAr ? 'العودة' : 'Back'}
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{isAr ? 'الرسائل' : 'Messages'}</h1>
        <button onClick={() => setShowNewForm(!showNewForm)} className="btn-primary text-sm">
          <Plus size={18} /> {isAr ? 'محادثة جديدة' : 'New conversation'}
        </button>
      </div>

      {/* New conversation form */}
      {showNewForm && (
        <div className="card mb-6 space-y-3">
          <div>
            <label className="label">{isAr ? 'الموضوع' : 'Subject'}</label>
            <input type="text" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} className="input" maxLength={200} />
          </div>
          <div>
            <label className="label">{isAr ? 'الرسالة' : 'Message'}</label>
            <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="input min-h-[100px]" maxLength={2000} />
          </div>
          <button onClick={handleNewConversation} disabled={sending || !newSubject.trim() || !newMessage.trim()} className="btn-primary">
            {sending ? <Spinner size={18} /> : <><Send size={18} /> {isAr ? 'إرسال' : 'Send'}</>}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Conversations list */}
        <div className="lg:col-span-1 space-y-2">
          {conversations.length === 0 && (
            <p className="text-center text-gray-400 py-8">{isAr ? 'لا توجد محادثات' : 'No conversations'}</p>
          )}
          {conversations.map(conv => {
            const lastMsg = conv.conversation_messages?.[conv.conversation_messages.length - 1]
            const unreadCount = conv.conversation_messages?.filter(m => m.sender_type === 'admin' && !m.read_at).length || 0
            return (
              <button
                key={conv.id}
                onClick={() => handleSelectConv(conv)}
                className={`w-full text-start p-3 rounded-lg border transition-colors ${
                  selectedConv?.id === conv.id ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm truncate flex-1">{conv.subject || (isAr ? 'بدون موضوع' : 'No subject')}</span>
                  {conv.status === 'closed' && <Lock size={12} className="text-gray-400 flex-shrink-0" />}
                </div>
                {lastMsg && <p className="text-xs text-gray-500 truncate">{lastMsg.sender_type === 'user' ? (isAr ? 'أنت: ' : 'You: ') : ''}{lastMsg.message}</p>}
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-400">{new Date(conv.updated_at).toLocaleDateString()}</span>
                  {unreadCount > 0 && <span className="bg-primary-600 text-white text-xs px-1.5 rounded-full">{unreadCount}</span>}
                </div>
              </button>
            )
          })}
        </div>

        {/* Messages panel */}
        <div className="lg:col-span-2">
          {selectedConv ? (
            <div className="card flex flex-col" style={{ minHeight: '400px' }}>
              {/* Header */}
              <div className="flex items-center justify-between border-b pb-3 mb-3">
                <div>
                  <h3 className="font-medium">{selectedConv.subject || (isAr ? 'بدون موضوع' : 'No subject')}</h3>
                  <p className="text-xs text-gray-400">
                    {selectedConv.status === 'closed' ? (isAr ? '🔒 مغلقة — لفتح محادثة جديدة اضغط "محادثة جديدة"' : '🔒 Closed — start a new conversation') : (isAr ? 'مفتوحة' : 'Open')}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-4" style={{ maxHeight: '400px' }}>
                {conversationMessages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg ${
                      msg.sender_type === 'user'
                        ? 'bg-primary-600 text-white rounded-br-none'
                        : 'bg-gray-100 text-gray-800 rounded-bl-none'
                    }`}>
                      <p className="text-sm whitespace-pre-line">{msg.message}</p>
                      <p className={`text-xs mt-1 ${msg.sender_type === 'user' ? 'text-primary-200' : 'text-gray-400'}`}>
                        {msg.sender_type === 'user' ? (isAr ? 'أنت' : 'You') : (isAr ? 'الإدارة' : 'Admin')}
                        {' • '}
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply box */}
              {selectedConv.status === 'open' ? (
                <div className="flex gap-2 border-t pt-3">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleReply() }}
                    className="input flex-1"
                    placeholder={isAr ? 'اكتب ردك...' : 'Type your reply...'}
                    maxLength={2000}
                  />
                  <button onClick={handleReply} disabled={sending || !replyText.trim()} className="btn-primary">
                    {sending ? <Spinner size={18} /> : <Send size={18} />}
                  </button>
                </div>
              ) : (
                <div className="text-center py-3 border-t">
                  <p className="text-sm text-gray-500 mb-2">{isAr ? 'هذه المحادثة مغلقة' : 'This conversation is closed'}</p>
                  <button onClick={() => setShowNewForm(true)} className="btn-outline text-sm">
                    <Plus size={16} /> {isAr ? 'محادثة جديدة' : 'New conversation'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="card flex items-center justify-center text-gray-400" style={{ minHeight: '400px' }}>
              <div className="text-center">
                <MessageCircle size={48} className="mx-auto mb-3 opacity-50" />
                <p>{isAr ? 'اختر محادثة أو ابدأ واحدة جديدة' : 'Select a conversation or start a new one'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
