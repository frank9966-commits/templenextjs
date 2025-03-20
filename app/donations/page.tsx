"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import DonationsPrompt from "@/components/donations/DonationsPrompt";
import DonationsQuery from "@/components/donations/DonationsQuery";
import DonationsForm from "@/components/donations/DonationsForm";

export default function RegisterStep() {
  const [hasParticipated, setHasParticipated] = useState<boolean | null>(null);
  const [currentEvent, setCurrentEvent] = useState<{ id: number; title: string; total_amount: number } | null>(null);

  useEffect(() => {
    async function fetchCurrentEvent() {
      const { data, error } = await supabase
        .from("donations_events")
        .select("id, title, total_amount")
        .order("created_at", { ascending: false })  // 新增：依 created_at 排序
        .limit(1)                                      // 新增：僅取最新一筆資料
        .single();
      if (!error && data) {
        setCurrentEvent(data);
      }
    }
    fetchCurrentEvent();
  }, []);

  useEffect(() => {
    const channel = supabase.channel("public:donations_events")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "donations_events" },
        (payload) => {
          if (payload.new) {
            // payload.new 代表更新後的資料
            setCurrentEvent((prev) =>
              prev ? { ...prev, total_amount: payload.new.total_amount } : null
            );
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);


  if (!currentEvent) {
    return <p>Loading event...</p>;
  }

  return (
    <div className="hero min-h-screen bg-base-200 p-4">
      <div className="hero-content flex-col w-full max-w-lg mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold">
            募款 - {currentEvent.title}
            <br />
            目前捐款餘額：{currentEvent.total_amount}
          </h1>
        </div>
        {hasParticipated === null ? (
          <DonationsPrompt setHasParticipated={setHasParticipated} />
        ) : hasParticipated === true ? (
          <DonationsQuery currentEvent={currentEvent} />
        ) : (
          <DonationsForm currentEvent={currentEvent} />
        )}
      </div>
    </div>
  );
}
