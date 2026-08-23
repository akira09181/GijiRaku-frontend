'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Shield, FileText, Send, CheckCircle2, AlertTriangle, MessageSquare } from 'lucide-react';
import { sendFeedback } from '../utils/api';

interface ModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

/**
 * 利用規約モーダル
 */
export function TermsModal({ isOpen, onClose }: ModalProps) {
  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-2xl dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-4 sm:p-5 border-b dark:border-slate-800 border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-base sm:text-lg dark:text-white text-slate-900">利用規約</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full dark:bg-slate-800 dark:hover:bg-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm dark:text-slate-300 text-slate-700 leading-relaxed">
          <section className="space-y-1.5">
            <h4 className="font-bold dark:text-white text-slate-900">第1条（目的）</h4>
            <p>
              本サービス「マチボイス（MachiVoice）」（以下「本サービス」）は、東京都および各自治体議会が公開するオープンデータをもとに、行政・議会情報を分かりやすく市民へ提供し、双方向の民意反映を促進することを目的としています。
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="font-bold dark:text-white text-slate-900">第2条（データの性質とAI要約の取扱い）</h4>
            <p>
              1. 本サービスが提示する「3分解説」「要約」等は、AIが公式議事録テキストを分析・整理した参考情報であり、自治体の公式な決定・見解を代行・断定するものではありません。
            </p>
            <p>
              2. 正確な条文および確定事項については、各画面に添付されている公式オープンデータURL・元議事録をご確認ください。
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="font-bold dark:text-white text-slate-900">第3条（リアクション・コメントの投稿）</h4>
            <p>
              1. 利用者は匿名にてリアクション（賛成・懸念・もっと知りたい・困っている）および意見コメントを投稿できます。
            </p>
            <p>
              2. 投稿された集計データは統計処理の上、行政・議員向け分析画面（EBPM）へ反映されます。公序良俗に反する誹謗中傷等は事後削除される場合があります。
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="font-bold dark:text-white text-slate-900">第4条（免責事項）</h4>
            <p>
              本サービスの提供情報に起因して利用者に生じた損害について、運営者は法令の許す範囲において責任を負わないものとします。
            </p>
          </section>
        </div>

        <div className="p-4 border-t dark:border-slate-800 border-slate-200 dark:bg-slate-950 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * プライバシーポリシーモーダル
 */
export function PrivacyModal({ isOpen, onClose }: ModalProps) {
  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-2xl dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="p-4 sm:p-5 border-b dark:border-slate-800 border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-base sm:text-lg dark:text-white text-slate-900">プライバシーポリシー</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full dark:bg-slate-800 dark:hover:bg-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm dark:text-slate-300 text-slate-700 leading-relaxed">
          <section className="space-y-1.5">
            <h4 className="font-bold dark:text-white text-slate-900">1. 取得する情報</h4>
            <p>
              本サービスでは、個人の氏名・住所などの特定個人情報は原則として取得しません。ブラウザ単位で発行される匿名識別子（UUID）、選択した自治体・テーマ、リアクション種別、通知希望メールアドレス（登録時のみ）を暗号化保存します。
            </p>
          </section>

          <section className="space-y-1.5">
            <h4 className="font-bold dark:text-white text-slate-900">2. 情報の利用目的</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>住民リアクションの集計および行政・議員向けEBPM分析への統計的反映</li>
              <li>希望された自治体・テーマに関する議会更新通知の配信</li>
              <li>サービス品質の向上および不具合対応</li>
            </ul>
          </section>

          <section className="space-y-1.5">
            <h4 className="font-bold dark:text-white text-slate-900">3. 第三者提供について</h4>
            <p>
              収集したデータは統計的数値（例: ○○区の給食費に関して賛成○件、困っている○件）としてのみ行政・政策分析等に活用され、個人のプライバシーを侵害する形式で第三者に提供されることはありません。
            </p>
          </section>
        </div>

        <div className="p-4 border-t dark:border-slate-800 border-slate-200 dark:bg-slate-950 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            確認しました
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/**
 * フィードバック・通報モーダル
 */
export function FeedbackModal({
  isOpen,
  onClose,
  assemblyId,
}: ModalProps & { readonly assemblyId?: string }) {
  const [category, setCategory] = useState<'feedback' | 'data_correction' | 'report'>('feedback');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await sendFeedback({
        category,
        content: content.trim(),
        assemblyId: assemblyId || '',
      });
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setContent('');
        onClose();
      }, 2500);
    } catch {
      alert('送信に失敗しました。時間をおいて再送してください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg dark:bg-slate-900 bg-white border dark:border-slate-800 border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 sm:p-5 border-b dark:border-slate-800 border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-bold text-base sm:text-lg dark:text-white text-slate-900">
              ご意見・改善提案・通報
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full dark:bg-slate-800 dark:hover:bg-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base dark:text-white text-slate-900">
              ご意見を送信しました
            </h4>
            <p className="text-xs dark:text-slate-400 text-slate-600">
              サービス改善およびオープンデータの精度向上に役立てさせていただきます。
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold dark:text-slate-300 text-slate-700">
                種別
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'feedback', label: '💡 改善の提案' },
                  { id: 'data_correction', label: '🔍 データの誤り修正' },
                  { id: 'report', label: '⚠️ 不適切・通報' },
                ].map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setCategory(item.id as any)}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
                      category === item.id
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                        : 'dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300 bg-slate-50 border-slate-300 text-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold dark:text-slate-300 text-slate-700">
                内容（自由記述）
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="「○○区の○○テーマの要約について」「追加してほしい機能」などをご記入ください..."
                rows={4}
                required
                className="w-full p-3 dark:bg-slate-950 dark:border-slate-800 dark:text-white bg-slate-50 border-slate-300 text-slate-900 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold dark:text-slate-400 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !content.trim()}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? '送信中...' : '送信する'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
