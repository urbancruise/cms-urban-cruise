"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { api } from "@/lib/api";
import { fetcher } from "@/lib/swr-config";
import {
  MdOutlineAdd,
  MdOutlineChat,
  MdOutlineClose,
  MdOutlineDelete,
  MdOutlineEdit,
  MdOutlinePeople,
  MdOutlineQuestionAnswer,
  MdOutlineRefresh,
  MdOutlineSchedule,
  MdOutlineSend,
  MdOutlineSettings,
} from "react-icons/md";

type Tab = "inbox" | "faqs" | "agents" | "settings";
type Status = "draft" | "published" | "archived";

interface Overview {
  publishedFaqs: number;
  draftFaqs: number;
  waitingConversations: number;
  activeConversations: number;
  activeAgents: number;
  serviceModeOverride: string | null;
}

interface Category {
  id: number;
  slug: string;
  displayNameEn: string;
  displayNameHi: string;
  sortOrder: number;
  status: Status;
  faqCount: number;
}

interface Faq {
  id: number;
  categoryId: number;
  categorySlug: string;
  categoryNameEn: string;
  categoryNameHi: string;
  categoryStatus: Status;
  languageCode: "en" | "hi";
  question: string;
  answer: string;
  status: Status;
  needsApproval: boolean;
  updatedAt: string;
  keywords: string[];
}

interface Conversation {
  id: number;
  locationSlug: string;
  status: "waiting" | "active" | "closed";
  assignedAgentName: string | null;
  lastMessage: string | null;
  lastMessageType: "user" | "assistant" | "agent" | null;
  lastActivityAt: string;
}

interface ChatMessage {
  id: string;
  author: "user" | "assistant" | "agent";
  text: string;
  createdAt: string;
}

interface Agent {
  id: number;
  username: string;
  email: string;
  displayName: string;
  isActive: boolean;
  openConversations: number;
}

interface BusinessDay {
  weekday: number;
  dayStart: string | null;
  dayEnd: string | null;
  isOpen: boolean;
}

interface Holiday {
  holidayDate: string;
  label: string;
  modeOverride: "day" | "night" | "closed";
  dayStart: string | null;
  dayEnd: string | null;
  isActive: boolean;
}

const tabs: { id: Tab; label: string; icon: typeof MdOutlineChat }[] = [
  { id: "inbox", label: "Live inbox", icon: MdOutlineChat },
  { id: "faqs", label: "FAQs", icon: MdOutlineQuestionAnswer },
  { id: "agents", label: "Agents", icon: MdOutlinePeople },
  { id: "settings", label: "Schedule & holidays", icon: MdOutlineSchedule },
];

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const inputClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100";
const buttonClass = "inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButtonClass = "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

export default function ChatbotAdminPage() {
  const [tab, setTab] = useState<Tab>("inbox");
  const [notice, setNotice] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [location, setLocation] = useState("all");
  const [conversationStatus, setConversationStatus] = useState("waiting");
  const [reply, setReply] = useState("");
  const [savingReply, setSavingReply] = useState(false);

  const { data: overview, error: overviewError, mutate: refreshOverview } = useSWR<Overview>("/api/admin/chatbot/overview", fetcher, {
    refreshInterval: 15000,
  });
  const { data: categoryData, error: categoriesError, mutate: refreshCategories } = useSWR<{ categories: Category[] }>(
    "/api/admin/chatbot/faq-categories",
    fetcher,
  );
  const { data: faqData, error: faqsError, mutate: refreshFaqs } = useSWR<{ faqs: Faq[] }>(
    "/api/admin/chatbot/faqs",
    fetcher,
  );
  const conversationsKey = useMemo(() => {
    const query = new URLSearchParams({ status: conversationStatus, location });
    return `/api/admin/chatbot/conversations?${query}`;
  }, [conversationStatus, location]);
  const { data: conversationsData, error: conversationsError, mutate: refreshConversations } = useSWR<{
    conversations: Conversation[];
    locationCounts: { locationSlug: string; count: number }[];
    statusCounts: Record<string, number>;
  }>(conversationsKey, fetcher, { refreshInterval: 8000 });
  const { data: threadData, error: threadError, mutate: refreshThread } = useSWR<{
    messages: ChatMessage[];
    status: string;
  }>(
    selectedConversation === null ? null : `/api/admin/chatbot/conversations/${selectedConversation}`,
    fetcher,
    { refreshInterval: 5000 },
  );
  const { data: agentData, error: agentsError, mutate: refreshAgents } = useSWR<{ agents: Agent[] }>(
    "/api/admin/chatbot/agents",
    fetcher,
  );
  const { data: settingsData, error: settingsError, mutate: refreshSettings } = useSWR<{
    weeklyHours: BusinessDay[];
    serviceModeOverride: "auto" | "day" | "night";
    timezone: string;
  }>("/api/admin/chatbot/settings", fetcher);
  const { data: holidayData, error: holidaysError, mutate: refreshHolidays } = useSWR<{ holidays: Holiday[] }>(
    "/api/admin/chatbot/holidays",
    fetcher,
  );

  const categories = categoryData?.categories ?? [];
  const faqs = faqData?.faqs ?? [];
  const conversations = conversationsData?.conversations ?? [];
  const loadErrors = [
    ["Overview", overviewError],
    ["FAQ categories", categoriesError],
    ["FAQs", faqsError],
    ["Conversations", conversationsError],
    ["Selected conversation", threadError],
    ["Agent roster", agentsError],
    ["Business hours", settingsError],
    ["Holiday settings", holidaysError],
  ].filter((entry): entry is [string, Error] => entry[1] instanceof Error);

  async function refreshAll() {
    await Promise.all([
      refreshOverview(),
      refreshCategories(),
      refreshFaqs(),
      refreshConversations(),
      refreshAgents(),
      refreshSettings(),
      refreshHolidays(),
      selectedConversation === null ? Promise.resolve() : refreshThread(),
    ]);
  }

  async function sendReply(event: React.FormEvent) {
    event.preventDefault();
    if (selectedConversation === null || !reply.trim()) return;
    setSavingReply(true);
    setNotice("");
    try {
      await api(`/api/admin/chatbot/conversations/${selectedConversation}`, {
        method: "POST",
        body: { text: reply },
      });
      setReply("");
      await Promise.all([refreshThread(), refreshConversations(), refreshOverview()]);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not send reply.");
    } finally {
      setSavingReply(false);
    }
  }

  async function closeConversation() {
    if (selectedConversation === null) return;
    try {
      await api(`/api/admin/chatbot/conversations/${selectedConversation}`, { method: "PATCH" });
      setSelectedConversation(null);
      await Promise.all([refreshConversations(), refreshOverview()]);
      setNotice("Conversation closed.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not close conversation.");
    }
  }

  return (
    <div className="min-h-full bg-slate-50 p-4 sm:p-8">
      <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Chatbot operations</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage live customer conversations, FAQ answers, agent access, and service hours.
          </p>
        </div>
        <button className={secondaryButtonClass} onClick={() => void refreshAll()}>
          <MdOutlineRefresh className="h-4 w-4" /> Refresh
        </button>
      </header>

      {notice && (
        <div role="status" className="mb-4 flex items-center justify-between rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
          <span>{notice}</span>
          <button aria-label="Dismiss message" onClick={() => setNotice("")}><MdOutlineClose /></button>
        </div>
      )}
      {loadErrors.length > 0 && (
        <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <p className="font-semibold">Some chatbot data could not be loaded.</p>
          <ul className="mt-1 list-inside list-disc">
            {loadErrors.map(([label, error]) => <li key={label}>{label}: {error.message}</li>)}
          </ul>
        </div>
      )}

      <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <SummaryCard label="Waiting" value={overview?.waitingConversations ?? 0} emphasis="text-amber-700" />
        <SummaryCard label="Active chats" value={overview?.activeConversations ?? 0} />
        <SummaryCard label="Published FAQs" value={overview?.publishedFaqs ?? 0} />
        <SummaryCard label="Draft FAQs" value={overview?.draftFaqs ?? 0} />
        <SummaryCard label="Active agents" value={overview?.activeAgents ?? 0} />
      </section>

      <nav className="mb-5 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1" aria-label="Chatbot sections">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium ${
              tab === id ? "bg-teal-50 text-teal-800" : "text-slate-600 hover:bg-slate-50"
            }`}
            onClick={() => setTab(id)}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </nav>

      {tab === "inbox" && (
        <section className="grid min-h-[620px] gap-4 xl:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.5fr)]">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex flex-wrap gap-2 border-b border-slate-100 p-4">
              <select className={inputClass} value={conversationStatus} onChange={(event) => {
                setConversationStatus(event.target.value);
                setSelectedConversation(null);
              }}>
                <option value="waiting">Waiting ({conversationsData?.statusCounts.waiting ?? 0})</option>
                <option value="active">Active ({conversationsData?.statusCounts.active ?? 0})</option>
                <option value="closed">Closed ({conversationsData?.statusCounts.closed ?? 0})</option>
                <option value="all">All recent chats</option>
              </select>
              <select className={inputClass} value={location} onChange={(event) => {
                setLocation(event.target.value);
                setSelectedConversation(null);
              }}>
                <option value="all">All locations</option>
                {(conversationsData?.locationCounts ?? [])
                  .sort((a, b) => a.locationSlug.localeCompare(b.locationSlug))
                  .map((item) => (
                    <option key={item.locationSlug} value={item.locationSlug}>
                      {formatLocation(item.locationSlug)} ({item.count})
                    </option>
                  ))}
              </select>
            </div>
            <div className="max-h-[560px] overflow-y-auto">
              {conversations.length === 0 ? (
                <EmptyState text="No conversations in this queue." />
              ) : conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation.id)}
                  className={`w-full border-b border-slate-100 p-4 text-left hover:bg-slate-50 ${
                    selectedConversation === conversation.id ? "bg-teal-50" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-800">Chat #{conversation.id}</span>
                    <StatusBadge status={conversation.status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatLocation(conversation.locationSlug)} · {formatDate(conversation.lastActivityAt)}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                    {conversation.lastMessage || "No messages yet"}
                  </p>
                  {conversation.assignedAgentName && (
                    <p className="mt-1 text-xs text-teal-700">Assigned to {conversation.assignedAgentName}</p>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex min-h-[560px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
            {selectedConversation === null ? (
              <EmptyState text="Select a conversation to view and reply." />
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div>
                    <h2 className="font-semibold text-slate-900">Conversation #{selectedConversation}</h2>
                    <p className="text-xs text-slate-500">Messages are retained for 90 days.</p>
                  </div>
                  {threadData?.status !== "closed" && (
                    <button className={secondaryButtonClass} onClick={() => void closeConversation()}>
                      <MdOutlineClose className="h-4 w-4" /> Close chat
                    </button>
                  )}
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-5">
                  {(threadData?.messages ?? []).map((message) => (
                    <div key={message.id} className={`flex ${message.author === "user" ? "justify-start" : "justify-end"}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                        message.author === "user" ? "bg-white text-slate-800 shadow-sm" :
                        message.author === "agent" ? "bg-teal-600 text-white" : "bg-sky-100 text-slate-800"
                      }`}>
                        <p className="mb-1 text-[11px] font-semibold uppercase opacity-70">
                          {message.author === "agent" ? "Agent" : message.author}
                        </p>
                        <p className="whitespace-pre-wrap text-sm">{message.text}</p>
                        <p className="mt-1 text-right text-[10px] opacity-70">{formatDate(message.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                  {threadData?.messages.length === 0 && <p className="text-center text-sm text-slate-400">No messages found.</p>}
                </div>
                {threadData?.status !== "closed" ? (
                  <form onSubmit={sendReply} className="flex gap-2 border-t border-slate-100 p-4">
                    <textarea
                      className={`${inputClass} min-h-11 resize-y`}
                      value={reply}
                      maxLength={2000}
                      onChange={(event) => setReply(event.target.value)}
                      placeholder="Write a reply..."
                      aria-label="Reply to customer"
                    />
                    <button className={buttonClass} disabled={savingReply || !reply.trim()} type="submit">
                      <MdOutlineSend className="h-4 w-4" /> Send
                    </button>
                  </form>
                ) : (
                  <p className="border-t border-slate-100 p-4 text-center text-sm text-slate-500">This conversation is closed.</p>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {tab === "faqs" && (
        <FaqManagement
          categories={categories}
          faqs={faqs}
          onSaved={async (message) => {
            setNotice(message);
            await Promise.all([refreshCategories(), refreshFaqs(), refreshOverview()]);
          }}
          onError={setNotice}
        />
      )}

      {tab === "agents" && (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">CMS agent roster</h2>
              <p className="mt-1 text-sm text-slate-500">Agent accounts and roles are managed in CMS Users.</p>
            </div>
            <Link href="/admin/users" className={secondaryButtonClass}>Manage CMS users</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr><th className="px-5 py-3">Agent</th><th className="px-5 py-3">Email</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Open chats</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(agentData?.agents ?? []).map((agent) => (
                  <tr key={agent.id}>
                    <td className="px-5 py-4 font-medium text-slate-800">{agent.displayName}<span className="ml-2 text-xs font-normal text-slate-400">@{agent.username}</span></td>
                    <td className="px-5 py-4 text-slate-600">{agent.email}</td>
                    <td className="px-5 py-4"><StatusBadge status={agent.isActive ? "active" : "closed"} /></td>
                    <td className="px-5 py-4 text-slate-700">{agent.openConversations}</td>
                  </tr>
                ))}
                {!agentData?.agents.length && (
                  <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-500">No CMS users currently have the Agent role.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "settings" && (
        <SettingsPanel
          weeklyHours={settingsData?.weeklyHours ?? []}
          serviceModeOverride={settingsData?.serviceModeOverride ?? "auto"}
          holidays={holidayData?.holidays ?? []}
          onSaved={async (message) => {
            setNotice(message);
            await Promise.all([refreshSettings(), refreshHolidays(), refreshOverview()]);
          }}
          onError={setNotice}
        />
      )}
    </div>
  );
}

function SummaryCard({ label, value, emphasis = "text-slate-900" }: { label: string; value: number; emphasis?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${emphasis}`}>{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const style = status === "waiting"
    ? "bg-amber-50 text-amber-700"
    : status === "active" || status === "published"
      ? "bg-emerald-50 text-emerald-700"
      : status === "draft"
        ? "bg-slate-100 text-slate-600"
        : "bg-slate-100 text-slate-500";
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${style}`}>{status}</span>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="flex min-h-[200px] items-center justify-center p-8 text-center text-sm text-slate-400">{text}</div>;
}

function FaqManagement({
  categories,
  faqs,
  onSaved,
  onError,
}: {
  categories: Category[];
  faqs: Faq[];
  onSaved: (message: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  const blankCategory = { slug: "", displayNameEn: "", displayNameHi: "", sortOrder: 0, status: "draft" as Status };
  const blankFaq = {
    categoryId: 0,
    languageCode: "en" as "en" | "hi",
    question: "",
    answer: "",
    status: "draft" as Status,
    keywords: "",
  };
  const [categoryForm, setCategoryForm] = useState(blankCategory);
  const [editingCategory, setEditingCategory] = useState<number | null>(null);
  const [faqForm, setFaqForm] = useState(blankFaq);
  const [editingFaq, setEditingFaq] = useState<number | null>(null);
  const [showFaqForm, setShowFaqForm] = useState(false);
  const [saving, setSaving] = useState(false);

  function editCategory(category: Category) {
    setEditingCategory(category.id);
    setCategoryForm({
      slug: category.slug,
      displayNameEn: category.displayNameEn,
      displayNameHi: category.displayNameHi,
      sortOrder: category.sortOrder,
      status: category.status,
    });
  }

  function editFaq(faq: Faq) {
    setEditingFaq(faq.id);
    setFaqForm({
      categoryId: faq.categoryId,
      languageCode: faq.languageCode,
      question: faq.question,
      answer: faq.answer,
      status: faq.status,
      keywords: faq.keywords.join(", "),
    });
    setShowFaqForm(true);
  }

  async function saveCategory(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await api(editingCategory ? `/api/admin/chatbot/faq-categories/${editingCategory}` : "/api/admin/chatbot/faq-categories", {
        method: editingCategory ? "PUT" : "POST",
        body: categoryForm,
      });
      setCategoryForm(blankCategory);
      setEditingCategory(null);
      await onSaved("Category saved.");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Could not save category.");
    } finally {
      setSaving(false);
    }
  }

  async function saveFaq(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const body = {
        ...faqForm,
        categoryId: Number(faqForm.categoryId),
        keywords: faqForm.keywords.split(",").map((keyword) => keyword.trim()).filter(Boolean),
      };
      await api(editingFaq ? `/api/admin/chatbot/faqs/${editingFaq}` : "/api/admin/chatbot/faqs", {
        method: editingFaq ? "PUT" : "POST",
        body,
      });
      setFaqForm({ ...blankFaq, categoryId: categories[0]?.id ?? 0 });
      setEditingFaq(null);
      setShowFaqForm(false);
      await onSaved("FAQ saved.");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Could not save FAQ.");
    } finally {
      setSaving(false);
    }
  }

  function startFaq() {
    setEditingFaq(null);
    setFaqForm({ ...blankFaq, categoryId: categories[0]?.id ?? 0 });
    setShowFaqForm(true);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.8fr)]">
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">FAQ knowledge base</h2>
            <p className="mt-1 text-sm text-slate-500">Create English and Hindi answers for the chatbot.</p>
          </div>
          <button className={buttonClass} onClick={startFaq} disabled={!categories.length}>
            <MdOutlineAdd className="h-4 w-4" /> Add FAQ
          </button>
        </div>

        {showFaqForm && (
          <form onSubmit={saveFaq} className="grid gap-3 border-b border-teal-100 bg-teal-50/50 p-5 md:grid-cols-2">
            <h3 className="md:col-span-2 font-semibold text-slate-800">{editingFaq ? "Edit FAQ" : "New FAQ"}</h3>
            <label className="text-xs font-medium text-slate-600">Category
              <select className={`${inputClass} mt-1`} value={faqForm.categoryId} onChange={(event) => setFaqForm({ ...faqForm, categoryId: Number(event.target.value) })} required>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.displayNameEn} ({category.status})</option>)}
              </select>
            </label>
            <label className="text-xs font-medium text-slate-600">Language
              <select className={`${inputClass} mt-1`} value={faqForm.languageCode} onChange={(event) => setFaqForm({ ...faqForm, languageCode: event.target.value as "en" | "hi" })}>
                <option value="en">English</option><option value="hi">Hindi</option>
              </select>
            </label>
            <label className="text-xs font-medium text-slate-600 md:col-span-2">Question
              <input className={`${inputClass} mt-1`} maxLength={500} value={faqForm.question} onChange={(event) => setFaqForm({ ...faqForm, question: event.target.value })} required />
            </label>
            <label className="text-xs font-medium text-slate-600 md:col-span-2">Answer
              <textarea className={`${inputClass} mt-1 min-h-28`} maxLength={8000} value={faqForm.answer} onChange={(event) => setFaqForm({ ...faqForm, answer: event.target.value })} />
            </label>
            <label className="text-xs font-medium text-slate-600">Keywords (comma separated)
              <input className={`${inputClass} mt-1`} value={faqForm.keywords} onChange={(event) => setFaqForm({ ...faqForm, keywords: event.target.value })} placeholder="booking, refund, cab" />
            </label>
            <label className="text-xs font-medium text-slate-600">Status
              <select className={`${inputClass} mt-1`} value={faqForm.status} onChange={(event) => setFaqForm({ ...faqForm, status: event.target.value as Status })}>
                <option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
              </select>
            </label>
            <div className="flex justify-end gap-2 md:col-span-2">
              <button type="button" className={secondaryButtonClass} onClick={() => setShowFaqForm(false)}>Cancel</button>
              <button className={buttonClass} disabled={saving || !categories.length}>Save FAQ</button>
            </div>
          </form>
        )}

        <div className="divide-y divide-slate-100">
          {faqs.map((faq) => (
            <article key={faq.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <StatusBadge status={faq.status} />
                    <span className="text-xs text-slate-500">{faq.languageCode.toUpperCase()} · {faq.categoryNameEn}</span>
                  </div>
                  <h3 className="font-semibold text-slate-900">{faq.question}</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{faq.answer || "No answer yet."}</p>
                  {!!faq.keywords.length && <p className="mt-2 text-xs text-slate-400">Keywords: {faq.keywords.join(", ")}</p>}
                </div>
                <button className={secondaryButtonClass} onClick={() => editFaq(faq)}><MdOutlineEdit className="h-4 w-4" /> Edit</button>
              </div>
            </article>
          ))}
          {!faqs.length && <EmptyState text="No FAQs yet. Add a category, then create the first FAQ." />}
        </div>
      </section>

      <aside className="space-y-5">
        <form onSubmit={saveCategory} className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">{editingCategory ? "Edit category" : "FAQ categories"}</h2>
          <div className="space-y-3">
            <label className="block text-xs font-medium text-slate-600">URL slug
              <input className={`${inputClass} mt-1`} value={categoryForm.slug} onChange={(event) => setCategoryForm({
                ...categoryForm,
                slug: event.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
              })} placeholder="booking-help" required />
            </label>
            <label className="block text-xs font-medium text-slate-600">English name
              <input className={`${inputClass} mt-1`} value={categoryForm.displayNameEn} onChange={(event) => setCategoryForm({ ...categoryForm, displayNameEn: event.target.value })} required />
            </label>
            <label className="block text-xs font-medium text-slate-600">Hindi name
              <input className={`${inputClass} mt-1`} value={categoryForm.displayNameHi} onChange={(event) => setCategoryForm({ ...categoryForm, displayNameHi: event.target.value })} required />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-medium text-slate-600">Sort order
                <input className={`${inputClass} mt-1`} type="number" min={0} max={10000} value={categoryForm.sortOrder} onChange={(event) => setCategoryForm({ ...categoryForm, sortOrder: Number(event.target.value) })} />
              </label>
              <label className="text-xs font-medium text-slate-600">Status
                <select className={`${inputClass} mt-1`} value={categoryForm.status} onChange={(event) => setCategoryForm({ ...categoryForm, status: event.target.value as Status })}>
                  <option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
                </select>
              </label>
            </div>
            <div className="flex gap-2">
              {editingCategory && <button type="button" className={secondaryButtonClass} onClick={() => { setEditingCategory(null); setCategoryForm(blankCategory); }}>Cancel</button>}
              <button className={buttonClass} disabled={saving}><MdOutlineAdd className="h-4 w-4" /> {editingCategory ? "Update" : "Add category"}</button>
            </div>
          </div>
          <div className="mt-5 divide-y divide-slate-100 border-t border-slate-100">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{category.displayNameEn}</p>
                  <p className="text-xs text-slate-500">{category.displayNameHi} · {category.faqCount} FAQs · {category.status}</p>
                </div>
                <button type="button" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label={`Edit ${category.displayNameEn}`} onClick={() => editCategory(category)}><MdOutlineEdit /></button>
              </div>
            ))}
          </div>
        </form>
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Only published FAQs in published categories are available to the customer chatbot.
        </p>
      </aside>
    </div>
  );
}

function SettingsPanel({
  weeklyHours,
  serviceModeOverride,
  holidays,
  onSaved,
  onError,
}: {
  weeklyHours: BusinessDay[];
  serviceModeOverride: "auto" | "day" | "night";
  holidays: Holiday[];
  onSaved: (message: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  const [hours, setHours] = useState<BusinessDay[] | null>(null);
  const [mode, setMode] = useState<"auto" | "day" | "night" | null>(null);
  const [holidayForm, setHolidayForm] = useState({
    holidayDate: "",
    label: "",
    modeOverride: "closed" as Holiday["modeOverride"],
    dayStart: "",
    dayEnd: "",
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const currentHours = hours ?? weeklyHours;
  const currentMode = mode ?? serviceModeOverride;

  async function saveSettings(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await api("/api/admin/chatbot/settings", {
        method: "PUT",
        body: { weeklyHours: currentHours, serviceModeOverride: currentMode },
      });
      setHours(null);
      setMode(null);
      await onSaved("Chatbot schedule saved.");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Could not save schedule.");
    } finally {
      setSaving(false);
    }
  }

  async function saveHoliday(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await api("/api/admin/chatbot/holidays", {
        method: "POST",
        body: {
          ...holidayForm,
          dayStart: holidayForm.dayStart || null,
          dayEnd: holidayForm.dayEnd || null,
        },
      });
      setHolidayForm({ holidayDate: "", label: "", modeOverride: "closed", dayStart: "", dayEnd: "", isActive: true });
      await onSaved("Holiday saved.");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Could not save holiday.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteHoliday(holiday: Holiday) {
    if (!window.confirm(`Remove holiday override for ${holiday.label}?`)) return;
    try {
      await api(`/api/admin/chatbot/holidays?date=${holiday.holidayDate}`, { method: "DELETE" });
      await onSaved("Holiday removed.");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Could not remove holiday.");
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
      <form onSubmit={saveSettings} className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-5 flex items-center gap-3">
          <MdOutlineSettings className="h-6 w-6 text-teal-600" />
          <div><h2 className="text-lg font-semibold text-slate-900">Business hours</h2><p className="text-sm text-slate-500">Times are in India Standard Time (Asia/Kolkata).</p></div>
        </div>
        <div className="space-y-3">
          {currentHours.map((day) => (
            <div key={day.weekday} className="grid items-center gap-3 rounded-lg border border-slate-100 p-3 sm:grid-cols-[1fr_auto_1fr_1fr]">
              <span className="text-sm font-medium text-slate-700">{weekdays[day.weekday]}</span>
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input type="checkbox" checked={day.isOpen} onChange={(event) => setHours(updateHours(currentHours, day.weekday, {
                  isOpen: event.target.checked,
                  dayStart: event.target.checked ? day.dayStart || "09:00" : null,
                  dayEnd: event.target.checked ? day.dayEnd || "21:00" : null,
                }))} />
                Open
              </label>
              <input aria-label={`${weekdays[day.weekday]} start time`} className={inputClass} type="time" disabled={!day.isOpen} value={day.dayStart ?? ""} onChange={(event) => setHours(updateHours(currentHours, day.weekday, { dayStart: event.target.value || null }))} />
              <input aria-label={`${weekdays[day.weekday]} end time`} className={inputClass} type="time" disabled={!day.isOpen} value={day.dayEnd ?? ""} onChange={(event) => setHours(updateHours(currentHours, day.weekday, { dayEnd: event.target.value || null }))} />
            </div>
          ))}
        </div>
        <label className="mt-5 block text-sm font-medium text-slate-700">Service mode override
          <select className={`${inputClass} mt-1`} value={currentMode} onChange={(event) => setMode(event.target.value as "auto" | "day" | "night")}>
            <option value="auto">Automatic (use weekly hours and holidays)</option>
            <option value="day">Force agent mode</option>
            <option value="night">Force FAQ mode</option>
          </select>
        </label>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">Day mode routes questions to agents; night mode uses published FAQs.</p>
          <button className={buttonClass} disabled={saving}><MdOutlineSchedule className="h-4 w-4" /> Save schedule</button>
        </div>
      </form>

      <div className="space-y-5">
        <form onSubmit={saveHoliday} className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Holiday override</h2>
          <div className="space-y-3">
            <label className="block text-xs font-medium text-slate-600">Date
              <input className={`${inputClass} mt-1`} type="date" value={holidayForm.holidayDate} onChange={(event) => setHolidayForm({ ...holidayForm, holidayDate: event.target.value })} required />
            </label>
            <label className="block text-xs font-medium text-slate-600">Name
              <input className={`${inputClass} mt-1`} value={holidayForm.label} onChange={(event) => setHolidayForm({ ...holidayForm, label: event.target.value })} required />
            </label>
            <label className="block text-xs font-medium text-slate-600">Service mode
              <select className={`${inputClass} mt-1`} value={holidayForm.modeOverride} onChange={(event) => setHolidayForm({ ...holidayForm, modeOverride: event.target.value as Holiday["modeOverride"] })}>
                <option value="closed">Closed / FAQ mode</option><option value="night">FAQ mode</option><option value="day">Agent mode</option>
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-medium text-slate-600">Agent start (optional)
                <input className={`${inputClass} mt-1`} type="time" value={holidayForm.dayStart} onChange={(event) => setHolidayForm({ ...holidayForm, dayStart: event.target.value })} />
              </label>
              <label className="text-xs font-medium text-slate-600">Agent end (optional)
                <input className={`${inputClass} mt-1`} type="time" value={holidayForm.dayEnd} onChange={(event) => setHolidayForm({ ...holidayForm, dayEnd: event.target.value })} />
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={holidayForm.isActive} onChange={(event) => setHolidayForm({ ...holidayForm, isActive: event.target.checked })} /> Active</label>
            <button className={buttonClass} disabled={saving}><MdOutlineAdd className="h-4 w-4" /> Save holiday</button>
          </div>
        </form>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Configured holidays</h2>
          <div className="divide-y divide-slate-100">
            {holidays.map((holiday) => (
              <div key={holiday.holidayDate} className="flex items-center justify-between gap-3 py-3">
                <div><p className="text-sm font-medium text-slate-800">{holiday.label}</p><p className="text-xs text-slate-500">{holiday.holidayDate} · {holiday.modeOverride}{!holiday.isActive ? " · inactive" : ""}</p></div>
                <button className="rounded-lg p-2 text-red-600 hover:bg-red-50" aria-label={`Remove ${holiday.label}`} onClick={() => void deleteHoliday(holiday)}><MdOutlineDelete /></button>
              </div>
            ))}
            {!holidays.length && <p className="py-5 text-center text-sm text-slate-400">No holiday overrides configured.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}

function updateHours(days: BusinessDay[], weekday: number, patch: Partial<BusinessDay>) {
  return days.map((day) => day.weekday === weekday ? { ...day, ...patch } : day);
}

function formatLocation(slug: string) {
  return slug === "global" ? "Global" : slug.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
