"use client";

import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import DonationsPrompt from "@/components/donations/DonationsPrompt";
import DonationsQuery from "@/components/donations/DonationsQuery";
import DonationsForm from "@/components/donations/DonationsForm";

type DonationEvent = {
  id: number;
  title: string;
  total_amount: number;
  allamount: number;
};

export default function RegisterStep() {
  const [hasParticipated, setHasParticipated] = useState<boolean | null>(null);
  const [currentEvent, setCurrentEvent] = useState<DonationEvent | null>(null);
  const [raisedAmount, setRaisedAmount] = useState(0);

  const refreshRaisedAmount = useCallback(async (eventId: number) => {
    const { data, error } = await supabase
      .from("donations")
      .select("donation_amount")
      .eq("event_id", eventId);

    if (error || !data) return;

    const sum = data.reduce(
      (acc, row) => acc + (Number(row.donation_amount) || 0),
      0
    );
    setRaisedAmount(sum);
  }, []);

  useEffect(() => {
    async function fetchCurrentEvent() {
      // 取最新一筆「有募款總額」的活動，避開誤建的截止/空活動
      const { data, error } = await supabase
        .from("donations_events")
        .select("id, title, total_amount, allamount")
        .gt("allamount", 0)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (!error && data) {
        setCurrentEvent(data);
        await refreshRaisedAmount(data.id);
      }
    }
    fetchCurrentEvent();
  }, [refreshRaisedAmount]);

  useEffect(() => {
    if (!currentEvent) return;

    const channel = supabase
      .channel(`public:donations_events:${currentEvent.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "donations_events",
          filter: `id=eq.${currentEvent.id}`,
        },
        (payload) => {
          if (payload.new) {
            setCurrentEvent((prev) =>
              prev
                ? {
                    ...prev,
                    total_amount: Number(payload.new.total_amount) || prev.total_amount,
                    allamount: Number(payload.new.allamount) || prev.allamount,
                    title: payload.new.title || prev.title,
                  }
                : null
            );
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "donations",
          filter: `event_id=eq.${currentEvent.id}`,
        },
        () => {
          void refreshRaisedAmount(currentEvent.id);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [currentEvent?.id, refreshRaisedAmount]);

  if (!currentEvent) {
    return <p>Loading event...</p>;
  }

  // 以前端加總為準，避免 total_amount 與實際捐款紀錄不同步
  const computedRemaining = Math.max(
    0,
    Number(currentEvent.allamount || 0) - raisedAmount
  );
  const eventForForm = {
    ...currentEvent,
    total_amount: computedRemaining,
  };

  return (
    <div className="hero min-h-screen bg-base-200 p-4">
      <div className="hero-content flex-col w-full max-w-lg mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold">
            募款 - {currentEvent.title}
            <br />
            募款總額：{currentEvent.allamount}
            <br />
            目前募款餘額：{computedRemaining}
          </h1>
        </div>
        {hasParticipated === null ? (
          <DonationsPrompt setHasParticipated={setHasParticipated} />
        ) : hasParticipated === true ? (
          <DonationsQuery currentEvent={eventForForm} />
        ) : (
          <DonationsForm currentEvent={eventForForm} />
        )}
      </div>
    </div>
  );
}
