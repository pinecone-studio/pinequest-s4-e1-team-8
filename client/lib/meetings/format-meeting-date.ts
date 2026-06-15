export const formatMeetingDate = (value: string | null) => {
  if (!value) return "";

  return new Date(value).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

export const formatMeetingDateLong = (value: string | null) => {
  if (!value) return "";

  return new Date(value).toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};
