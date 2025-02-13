// RegistrationPrompt.tsx
import React from "react";

interface RegistrationPromptProps {
  setHasParticipated: (value: boolean) => void;
}

const RegistrationPrompt: React.FC<RegistrationPromptProps> = ({ setHasParticipated }) => {
  return (
    <div className="card w-full shadow-xl bg-base-100">
      <div className="card-body">
        <p className="text-center text-lg mb-4">您是否曾註冊過此帳號？</p>
        <div className="flex justify-center gap-4">
          <button onClick={() => setHasParticipated(true)} className="btn btn-success">
            是
          </button>
          <button onClick={() => setHasParticipated(false)} className="btn btn-error">
            否
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPrompt;
