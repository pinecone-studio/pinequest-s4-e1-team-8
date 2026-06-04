const ALLOWED_TYPES = ["audio/mpeg", "audio/wav", "audio/mp4", "audio/ogg"];
const MAX_SIZE_MB = 100;

export const validateMeetingAudio = (file: File): string | null => {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `Unsupported audio type: ${file.type}`;
  }

  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return `File too large. Max ${MAX_SIZE_MB}MB`;
  }

  return null;
};
