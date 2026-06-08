type TaskAiInsightProps = {
  text: string;
};

export function TaskAiInsight({ text }: TaskAiInsightProps) {
  return (
    <p className="px-1 py-1 text-xs leading-relaxed text-muted-foreground">
      <span className="font-medium text-violet-400/90">AI insight · </span>
      {text}
    </p>
  );
}
