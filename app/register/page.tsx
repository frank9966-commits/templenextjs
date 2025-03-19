"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import RegistrationPrompt from "@/components/RegistrationPrompt";
import ParticipantQuery from "@/components/ParticipantQuery";
import RegistrationForm from "@/components/RegistrationForm";

export default function RegisterStep() {
  const [hasParticipated, setHasParticipated] = useState<boolean | null>(null);
  const [currentEvent, setCurrentEvent] = useState<{ id: number; title: string } | null>(null);

  useEffect(() => {
    async function fetchCurrentEvent() {
      const { data, error } = await supabase
        .from("events")
        .select("id, title")
        .order("created_at", { ascending: false })  // 新增：依 created_at 排序
        .limit(1)                                      // 新增：僅取最新一筆資料
        .single();
      if (!error && data) {
        setCurrentEvent(data);
      }
    }
    fetchCurrentEvent();
  }, []);

  if (!currentEvent) {
    return <p>Loading event...</p>;
  }

  return (
    <div className="hero min-h-screen bg-base-200 p-4">
      <div className="hero-content flex-col w-full max-w-lg mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold">
            報名活動 - {currentEvent.title}
          </h1>
        </div>
        {hasParticipated === null ? (
          <RegistrationPrompt setHasParticipated={setHasParticipated} />
        ) : hasParticipated === true ? (
          <ParticipantQuery currentEvent={currentEvent} />
        ) : (
          <RegistrationForm currentEvent={currentEvent} />
        )}
      </div>
    </div>
  );
}
