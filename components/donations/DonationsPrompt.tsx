import React from "react";

interface DonationsPromptProps {
  setHasParticipated: (value: boolean) => void;
}

const DonationsPrompt: React.FC<DonationsPromptProps> = ({ setHasParticipated }) => {
  return (
    <div className="card w-full shadow-xl bg-base-100">
      <div className="card-body">
        <p className="text-center text-lg mb-4">您是否曾註冊過此帳號？</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setHasParticipated(true)}
            className="px-6 py-3 rounded-lg text-white bg-[#E65C52] hover:opacity-90 text-lg font-bold"
          >
            是
          </button>
          <button
            onClick={() => setHasParticipated(false)}
            className="px-6 py-3 rounded-lg text-white bg-[#32C8C2] hover:opacity-90 text-lg font-bold"
          >
            否
          </button>
        </div>
      </div>
    </div>
  );
};

export default DonationsPrompt;
