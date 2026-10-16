"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Bell, X } from "lucide-react";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  payload?: any;
  is_read: boolean;
  created_at: string;
}

interface NotificationBellProps {
  role?: string;
  backendUrl?: string;
}

export function NotificationBell({ role = "farmer", backendUrl = "http://localhost:8000" }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch(`${backendUrl}/api/notifications/unread-count?role=${role}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count ?? 0);
      }
    } catch {
      // Ignore network errors in demo
    }
  }, [backendUrl, role]);

  const fetchAllNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/notifications?role=${role}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setNotifications(data);
        }
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [backendUrl, role]);

  const markAllAsRead = async () => {
    try {
      await fetch(`${backendUrl}/api/notifications/read-all?role=${role}`, {
        method: "PATCH",
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // Ignore
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      fetchAllNotifications();
      markAllAsRead();
    }
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 2500);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="relative flex items-center justify-center p-1 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
        aria-label="Open notifications"
      >
        <Bell className="w-4 h-4 text-[#94a3b8]" />
        {unreadCount > 0 && (
          unreadCount > 9 ? (
            <span className="absolute -top-1 -right-1 px-1 h-3.5 min-w-[14px] text-[9px] font-bold text-white bg-red-500 rounded-full flex items-center justify-center leading-none">
              {unreadCount}
            </span>
          ) : (
            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
          )
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-80 sm:w-96 rounded-md bg-white border border-slate-200 shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-2 bg-white border-b border-slate-200 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Notifications ({role.replace("_", " ")})
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-3 text-center text-xs text-slate-400">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-xs font-medium text-slate-900">No notifications</p>
                <p className="text-xs text-slate-500">Inbox is up to date.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 space-y-1 hover:bg-slate-50 ${
                    n.is_read ? "bg-white" : "bg-slate-50/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-900 leading-tight">
                      {n.title}
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-wide text-slate-400 shrink-0">
                      {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-normal">{n.body}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
