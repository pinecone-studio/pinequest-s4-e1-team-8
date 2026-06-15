export const formatRecordingDuration = (seconds: number | null | undefined) => {
  if (seconds == null || seconds <= 0) return null;

  if (seconds < 60) return `${seconds} sec`;

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;

  if (minutes < 60) {
    return remainder > 0 ? `${minutes} min ${remainder} sec` : `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours} hr ${remainingMinutes} min` : `${hours} hr`;
};

export const formatRecordingFileSize = (bytes: number | null | undefined) => {
  if (bytes == null || bytes <= 0) return null;

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
