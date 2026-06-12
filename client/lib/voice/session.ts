const MEETING_VOICE_VERIFIED_KEY = "brisk-meeting-voice-verified";

export function markVoiceVerified() {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.setItem(MEETING_VOICE_VERIFIED_KEY, "true");
}

export function isVoiceVerifiedThisSession() {
  if (typeof window === "undefined") {
    return false;
  }

  return sessionStorage.getItem(MEETING_VOICE_VERIFIED_KEY) === "true";
}

export function clearVoiceVerified() {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.removeItem(MEETING_VOICE_VERIFIED_KEY);
}
