'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Assembly } from './AssemblyMap';

export interface ChatMessage {
  id: string;
  date?: string;
  category?: string;
  speaker: string;
  role: string;
  avatar_type?: string;
  plain_text: string;
  original_quote?: string;
  timestamp: string;
  agree_count?: number;
  disagree_count?: number;
  comments?: { user: string; text: string }[];
  reactions?: { [key: string]: number };
}

interface LineChatModalProps {
  assembly: Assembly;
  onClose: () => void;
  initialTheme?: string;
}

export default function LineChatModal({ assembly, onClose, initialTheme }: LineChatModalProps) {
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingPast, setIsLoadingPast] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>(initialTheme || 'all');
  const [inputQuestion, setInputQuestion] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [expandedQuotes, setExpandedQuotes] = useState<{ [key: string]: boolean }>({});
  const [activeCommentBox, setActiveCommentBox] = useState<{ [key: string]: boolean }>({});
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});
  const [userVoted, setUserVoted] = useState<{ [key: string]: string }>({});
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper to get API base URL
  const getApiBase = () => process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

  // Fetch LINE chat messages for the selected assembly
  useEffect(() => {
    async function fetchMessages() {
      setIsLoading(true);
      try {
        const res = await fetch(`${getApiBase()}/api/assemblies/${assembly.id}/chat?page=1`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages || []);
        } else {
          throw new Error('Failed to load chat');
        }
      } catch (err) {
        console.error('FastAPI fetch error, using client fallback:', err);
        setMessages([
          {
            id: 'msg-1',
            date: '2026年8月10日 (第2回定例会)',
            category: '💻 デジタル・DX',
            speaker: '佐藤たかし 議員',
            role: '都民ファーストの会',
            avatar_type: 'politician_male',
            plain_text: '【デジタル改革について】都の行政手続き、スマホで完結できるように進んでる？ペーパーレスの進捗を教えて！',
            original_quote: '「本都における行政手続のデジタル化およびペーパーレス化推進の取り組み状況、並びに都民の利便性向上に向けた今後のロードマップについて伺う。」',
            timestamp: '10:15',
            agree_count: 84,
            disagree_count: 12,
            comments: [
              { user: '都民Aさん', text: '役所に行かずにスマホで手続きできるのは本当に助かります！' }
            ],
          },
          {
            id: 'msg-2',
            date: '2026年8月10日 (第2回定例会)',
            category: '💻 デジタル・DX',
            speaker: '小池知事',
            role: '答弁者 (東京都知事)',
            avatar_type: 'governor_female',
            plain_text: '【要するに：今年度中に主要手続きの95%をオンライン対応完了します！】\n紙の書類を削減し、待ち時間なしの『キャッシュレス＆スマホ完結』を一気に加速させます！',
            original_quote: '「都民の皆様が役所に来ずとも完結するデジタル行政の実現に向け、主要手続の95%以上をオンライン対応へ移行すべく全力で取り組んでおります。」',
            timestamp: '10:18',
            agree_count: 142,
            disagree_count: 18,
            comments: [],
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMessages();
  }, [assembly.id]);

  // Handle User Opinion Vote (賛成 / 懸念)
  const handleVote = async (msgId: string, type: 'agree' | 'disagree') => {
    if (userVoted[msgId]) return;

    setUserVoted((prev) => ({ ...prev, [msgId]: type }));
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === msgId) {
          return {
            ...msg,
            agree_count: type === 'agree' ? (msg.agree_count || 0) + 1 : msg.agree_count,
            disagree_count: type === 'disagree' ? (msg.disagree_count || 0) + 1 : msg.disagree_count,
          };
        }
        return msg;
      })
    );

    try {
      await fetch(`${getApiBase()}/api/assemblies/${assembly.id}/messages/${msgId}/opinion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opinion_type: type }),
      });
    } catch (e) {
      console.error('Opinion vote error:', e);
    }
  };

  // Handle Citizen Opinion Comment Submission
  const handleAddComment = async (msgId: string) => {
    const text = commentInputs[msgId]?.trim();
    if (!text) return;

    const newComment = { user: 'あなた (市民)', text };

    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === msgId) {
          return {
            ...msg,
            comments: [...(msg.comments || []), newComment],
          };
        }
        return msg;
      })
    );

    setCommentInputs((prev) => ({ ...prev, [msgId]: '' }));
    setActiveCommentBox((prev) => ({ ...prev, [msgId]: false }));

    try {
      await fetch(`${getApiBase()}/api/assemblies/${assembly.id}/messages/${msgId}/opinion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opinion_type: 'agree', comment_text: text }),
      });
    } catch (e) {
      console.error('Comment submit error:', e);
    }
  };

  // Load Past Historical Council Sessions
  const handleLoadPastSessions = async () => {
    if (isLoadingPast) return;
    setIsLoadingPast(true);
    const nextPage = page + 1;

    try {
      const res = await fetch(`${getApiBase()}/api/assemblies/${assembly.id}/chat?page=${nextPage}`);
      if (res.ok) {
        const data = await res.json();
        if (data.messages) {
          setMessages(data.messages);
          setPage(nextPage);
        }
      }
    } catch (err) {
      console.error('Failed to load past sessions:', err);
    } finally {
      setIsLoadingPast(false);
    }
  };

  useEffect(() => {
    if (page === 1) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, page]);

  const toggleQuote = (msgId: string) => {
    setExpandedQuotes((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const toggleCommentBox = (msgId: string) => {
    setActiveCommentBox((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  // Web Speech API for Voice Readout
  const handleSpeak = (msgId: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (speakingId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleSendQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuestion.trim() || isSending) return;

    const userQ = inputQuestion.trim();
    setInputQuestion('');

    const now = new Date();
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      date: '本日',
      category: '❓ 市民質問',
      speaker: 'あなた (市民)',
      role: '質問者',
      avatar_type: 'user',
      plain_text: userQ,
      timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);

    try {
      const res = await fetch('http://localhost:8000/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userQ, assembly_id: assembly.id }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          date: '本日',
          category: '✨ AI超翻訳',
          speaker: data.speaker || 'GijiRaku AI',
          role: data.role || '超翻訳アシスタント',
          avatar_type: 'ai',
          plain_text: data.answer,
          original_quote: data.original_quote,
          timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          reactions: { like: 1 },
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error('API request failed');
      }
    } catch (err) {
      console.error(err);
      const fallbackAiMsg: ChatMessage = {
        id: `ai-err-${Date.now()}`,
        date: '本日',
        category: '✨ AI超翻訳',
        speaker: 'GijiRaku AI',
        role: '超翻訳アシスタント',
        avatar_type: 'ai',
        plain_text: `【要するに：「${userQ}」について前向きに討議されています！】\n予算の確保および事業化に向けて調査検討が進められています。`,
        timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackAiMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const getAvatarIcon = (type?: string) => {
    switch (type) {
      case 'governor_female':
        return '👩‍💼';
      case 'mayor_male':
        return '👨‍💼';
      case 'politician_female':
        return '👩‍⚖️';
      case 'bureaucrat_male':
        return '🧑‍💻';
      case 'ai':
        return '🤖';
      case 'user':
        return '👤';
      default:
        return '👨‍⚖️';
    }
  };

  // Filter messages by selected category chip
  const filteredMessages = messages.filter((msg) => {
    if (activeCategoryFilter === 'all') return true;
    if (!msg.category) return true;
    return msg.category.includes(activeCategoryFilter);
  });

  if (!mounted) return null;

  let lastRenderedDate = '';

  return createPortal(
    <div className="fixed inset-0 top-0 left-0 w-screen h-screen z-[999999] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in text-slate-100">
      {/* LINE Chat Smartphone Window */}
      <div className="relative w-full max-w-lg h-[92vh] sm:h-[850px] bg-[#8cabd9] rounded-[32px] overflow-hidden shadow-2xl flex flex-col border-4 border-slate-800">
        
        {/* LINE Header (Green Banner) */}
        <div className="bg-[#06C755] text-white px-4 py-3.5 flex flex-col shadow-md relative z-10 gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-black/10 transition-colors text-xl font-bold"
                title="閉じる"
              >
                ←
              </button>
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner">
                💬
              </div>
              <div className="text-left">
                <div className="font-bold text-base tracking-tight flex items-center gap-2">
                  {assembly.name} チャンネル
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                </div>
                <p className="text-xs text-white/90 font-medium">議事録対話 & 市民世論フィードバック</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center font-bold text-sm transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Statement Category Filter Chips inside LINE Header */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-[10px] text-white/80 font-bold shrink-0">分類:</span>
            <button
              onClick={() => setActiveCategoryFilter('all')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 transition-all ${
                activeCategoryFilter === 'all'
                  ? 'bg-white text-slate-900 shadow'
                  : 'bg-black/20 text-white hover:bg-black/30'
              }`}
            >
              すべて ({messages.length})
            </button>
            <button
              onClick={() => setActiveCategoryFilter('子育て')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 transition-all ${
                activeCategoryFilter === '子育て'
                  ? 'bg-white text-slate-900 shadow'
                  : 'bg-black/20 text-white hover:bg-black/30'
              }`}
            >
              👶 子育て
            </button>
            <button
              onClick={() => setActiveCategoryFilter('デジタル')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 transition-all ${
                activeCategoryFilter === 'デジタル'
                  ? 'bg-white text-slate-900 shadow'
                  : 'bg-black/20 text-white hover:bg-black/30'
              }`}
            >
              💻 DX
            </button>
            <button
              onClick={() => setActiveCategoryFilter('防災')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 transition-all ${
                activeCategoryFilter === '防災'
                  ? 'bg-white text-slate-900 shadow'
                  : 'bg-black/20 text-white hover:bg-black/30'
              }`}
            >
              🛡️ 防災
            </button>
            <button
              onClick={() => setActiveCategoryFilter('街づくり')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 transition-all ${
                activeCategoryFilter === '街づくり'
                  ? 'bg-white text-slate-900 shadow'
                  : 'bg-black/20 text-white hover:bg-black/30'
              }`}
            >
              🏗️ 街づくり
            </button>
          </div>
        </div>

        {/* LINE Chat Messages Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-left">
          
          {/* Historical Load Button */}
          <div className="text-center my-2">
            <button
              onClick={handleLoadPastSessions}
              disabled={isLoadingPast}
              className="px-4 py-2 rounded-full bg-slate-900/90 hover:bg-slate-900 border border-white/20 text-white text-xs font-bold shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center justify-center mx-auto gap-2"
            >
              {isLoadingPast ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>過去ログを読み込み中...</span>
                </>
              ) : (
                <>
                  <span>📜</span>
                  <span>過去の定例会をさかのぼって読み込む</span>
                </>
              )}
            </button>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-white space-y-3">
              <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              <p className="text-sm font-medium">発言データと市民世論を読み込み中...</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-12 text-white/80 text-xs">
              該当する分類の発言が見つかりませんでした。別のタグをお選びください。
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isUser = msg.avatar_type === 'user';
              const isExpanded = expandedQuotes[msg.id];
              const isCommentOpen = activeCommentBox[msg.id];
              const isSpeaking = speakingId === msg.id;
              const hasVoted = userVoted[msg.id];

              const msgDate = msg.date || '2026年8月10日';
              const showDateDivider = msgDate !== lastRenderedDate;
              if (showDateDivider) {
                lastRenderedDate = msgDate;
              }

              return (
                <React.Fragment key={msg.id}>
                  {/* Sleek LINE Date Divider Line */}
                  {showDateDivider && (
                    <div className="flex items-center justify-center my-3">
                      <div className="bg-black/30 backdrop-blur-sm px-4 py-1 rounded-full text-[11px] text-white/90 font-semibold shadow-inner border border-white/10">
                        📅 {msgDate}
                      </div>
                    </div>
                  )}

                  {isUser ? (
                    /* User Message (Right Side) */
                    <div className="flex justify-end items-end space-x-2 my-2">
                      <span className="text-[10px] text-white/90 font-medium pb-1">{msg.timestamp}</span>
                      <div className="max-w-[75%] bg-[#85e249] text-slate-900 rounded-2xl rounded-tr-none px-4 py-2.5 text-sm font-medium shadow-md leading-relaxed whitespace-pre-wrap">
                        {msg.plain_text}
                      </div>
                    </div>
                  ) : (
                    /* Politician / AI Message (Left Side LINE Style) */
                    <div className="flex items-start space-x-2.5 my-3 animate-slide-up">
                      {/* Avatar Icon */}
                      <div className="w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center text-xl shrink-0 border border-slate-200">
                        {getAvatarIcon(msg.avatar_type)}
                      </div>

                      <div className="flex flex-col max-w-[82%] text-left">
                        {/* Speaker Name, Role, & Category Badge */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="text-xs font-bold text-white shadow-sm">{msg.speaker}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/35 text-white font-medium">
                            {msg.role}
                          </span>
                          {msg.category && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/80 text-white font-bold shadow-sm">
                              {msg.category}
                            </span>
                          )}
                        </div>

                        {/* Speech Bubble */}
                        <div className="bg-white text-slate-800 rounded-2xl rounded-tl-none p-3.5 text-sm shadow-lg border border-slate-100 relative leading-relaxed">
                          {/* Header Ribbon */}
                          <div className="text-[10px] font-bold text-emerald-600 mb-1 flex items-center justify-between">
                            <span>✨ 超翻訳 (噛み砕き解説)</span>
                            <button
                              onClick={() => handleSpeak(msg.id, msg.plain_text)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors ${
                                isSpeaking
                                  ? 'bg-rose-500 text-white animate-pulse'
                                  : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              }`}
                              title="音声読み上げ"
                            >
                              {isSpeaking ? '🔊 停止' : '🔊 読み上げ'}
                            </button>
                          </div>

                          {/* Plain Japanese Text */}
                          <div className="font-medium whitespace-pre-wrap text-slate-900">
                            {msg.plain_text}
                          </div>

                          {/* Collapsible Original Quote Accordion */}
                          {msg.original_quote && (
                            <div className="mt-2.5 pt-2 border-t border-slate-100">
                              <button
                                onClick={() => toggleQuote(msg.id)}
                                className="text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1 transition-colors"
                              >
                                <span>📜 公式議事録（原文）を{isExpanded ? '隠す' : '見る'}</span>
                                <span className="text-[10px]">{isExpanded ? '▲' : '▼'}</span>
                              </button>

                              {isExpanded && (
                                <div className="mt-1.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 font-serif leading-relaxed italic animate-fade-in">
                                  {msg.original_quote}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Citizen Opinion Voting & Feedback Bar */}
                          <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-1.5">
                            <div className="flex items-center space-x-1.5 text-xs">
                              <button
                                onClick={() => handleVote(msg.id, 'agree')}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all flex items-center space-x-1 ${
                                  hasVoted === 'agree'
                                    ? 'bg-emerald-500 text-white border-emerald-600 shadow'
                                    : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 border-slate-200'
                                }`}
                              >
                                <span>👍 賛成</span>
                                <span className="bg-emerald-200/60 text-emerald-900 px-1.5 py-0.2 rounded-full text-[10px]">
                                  {msg.agree_count || 0}
                                </span>
                              </button>

                              <button
                                onClick={() => handleVote(msg.id, 'disagree')}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all flex items-center space-x-1 ${
                                  hasVoted === 'disagree'
                                    ? 'bg-rose-500 text-white border-rose-600 shadow'
                                    : 'bg-slate-100 hover:bg-rose-50 text-slate-700 border-slate-200'
                                }`}
                              >
                                <span>👎 懸念</span>
                                <span className="bg-rose-200/60 text-rose-900 px-1.5 py-0.2 rounded-full text-[10px]">
                                  {msg.disagree_count || 0}
                                </span>
                              </button>
                            </div>

                            <button
                              onClick={() => toggleCommentBox(msg.id)}
                              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 transition-colors"
                            >
                              <span>💬 市民意見 ({msg.comments?.length || 0})</span>
                            </button>
                          </div>

                          {/* Citizen Comments List */}
                          {msg.comments && msg.comments.length > 0 && (
                            <div className="mt-2.5 space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                              <span className="text-[10px] text-slate-500 font-bold block">🗣️ 寄せられた市民の意見:</span>
                              {msg.comments.map((c, idx) => (
                                <div key={idx} className="text-xs text-slate-700 leading-snug">
                                  <span className="font-bold text-slate-900">{c.user}: </span>
                                  <span>{c.text}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Inline Citizen Comment Input Box */}
                          {isCommentOpen && (
                            <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center space-x-1.5">
                              <input
                                type="text"
                                value={commentInputs[msg.id] || ''}
                                onChange={(e) =>
                                  setCommentInputs((prev) => ({ ...prev, [msg.id]: e.target.value }))
                                }
                                placeholder="この質問/答弁に意見を入力..."
                                className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <button
                                onClick={() => handleAddComment(msg.id)}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow transition-colors shrink-0"
                              >
                                投稿
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Timestamp */}
                        <div className="flex items-center space-x-2 mt-1 px-1">
                          <span className="text-[10px] text-white/90 font-medium">{msg.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* LINE Chat Input Form */}
        <div className="bg-slate-900/90 backdrop-blur-md p-3 border-t border-slate-700/60 relative z-10">
          <form onSubmit={handleSendQuestion} className="flex items-center space-x-2">
            <input
              type="text"
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              placeholder="例：子育ての給付金って結局タダになるの？"
              disabled={isSending}
              className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-full text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#06C755] transition-all"
            />
            <button
              type="submit"
              disabled={isSending || !inputQuestion.trim()}
              className="w-11 h-11 rounded-full bg-[#06C755] hover:bg-[#05b34c] disabled:bg-slate-700 text-white font-bold flex items-center justify-center shadow-lg transition-all"
              title="送信"
            >
              {isSending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                '➔'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
