"use client";

import { Button } from "@/components/ui/button";
import { useGithubUserId } from "@/hooks/use-github-user-id";
import {
  createGithubIssue,
  createGithubPull,
  extractApiError,
  fetchGithubBranches,
  fetchGithubIssues,
  fetchGithubPulls,
  fetchGithubRepos,
  fetchGithubStatus,
  fetchIssueComments,
  fetchIssueDetail,
  fetchPullChecks,
  fetchPullComments,
  fetchPullCommits,
  fetchPullDetail,
  fetchPullFiles,
  fetchRepoLabels,
  generatePrMessage,
  getGithubRepo,
  mergeGithubPull,
  patchIssue,
  patchPull,
  postIssueComment,
  postPullComment,
  postPullReview,
  setGithubUserId,
  type GithubCheckRun,
  type GithubComment,
  type GithubIssueItem,
  type GithubLabel,
  type GithubPullFile,
  type GithubPullItem,
  type GithubRepoOption,
  type GithubReview,
  type PrFilter,
  redirectToGithubConnect,
} from "@/lib/integrations/github";
import { cn } from "@/lib/utils";
import { CheckCircle2, ExternalLink, GitPullRequest, Loader2, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CreatePrForm } from "./create-pr-form";
import { IssueDetail } from "./issue-detail";
import { PrDetail } from "./pr-detail";
import { PrFeed } from "./pr-feed";

type WorkflowMode = "issue" | "pull";
type FeedTab = "pulls" | "issues";
type ViewMode = "detail" | "create";

type AppliedItem = {
  kind: WorkflowMode;
  number: number;
  title: string;
  repo: string;
  url: string;
  appliedAt: Date;
};

export function WorkflowContent() {
  const { userId, isLoaded } = useGithubUserId();

  const [connected, setConnected] = useState(false);
  const [authMode, setAuthMode] = useState<"oauth" | "test-token">();
  const [githubLogin, setGithubLogin] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [repos, setRepos] = useState<GithubRepoOption[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [branches, setBranches] = useState<string[]>([]);
  const [pulls, setPulls] = useState<GithubPullItem[]>([]);
  const [issues, setIssues] = useState<GithubIssueItem[]>([]);
  const [selectedPull, setSelectedPull] = useState<GithubPullItem | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<GithubIssueItem | null>(null);
  const [feedTab, setFeedTab] = useState<FeedTab>("pulls");
  const [prFilter, setPrFilter] = useState<PrFilter>("open");
  const [viewMode, setViewMode] = useState<ViewMode>("create");

  const [mode, setMode] = useState<WorkflowMode>("pull");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [headBranch, setHeadBranch] = useState("");
  const [baseBranch, setBaseBranch] = useState("main");
  const [draft, setDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [merging, setMerging] = useState(false);
  const [closing, setClosing] = useState(false);
  const [mergeMethod, setMergeMethod] = useState<"merge" | "squash" | "rebase">("merge");
  const [error, setError] = useState<string>();
  const detailRequestRef = useRef(0);
  const [applied, setApplied] = useState<AppliedItem[]>([]);

  const [detailLoading, setDetailLoading] = useState(false);
  const [pullFiles, setPullFiles] = useState<GithubPullFile[]>([]);
  const [pullCommits, setPullCommits] = useState<
    { sha: string; commit: { message: string; author: { name: string; date: string } } }[]
  >([]);
  const [pullComments, setPullComments] = useState<GithubComment[]>([]);
  const [pullReviews, setPullReviews] = useState<GithubReview[]>([]);
  const [pullChecks, setPullChecks] = useState<{
    state: string;
    total_count: number;
    check_runs: GithubCheckRun[];
  } | null>(null);

  const [issueComments, setIssueComments] = useState<GithubComment[]>([]);
  const [repoLabels, setRepoLabels] = useState<GithubLabel[]>([]);
  const [issueSaving, setIssueSaving] = useState(false);

  const repoParts = useMemo(() => {
    if (!selectedRepo.includes("/")) return null;
    const [owner, repo] = selectedRepo.split("/");
    return owner && repo ? { owner, repo } : null;
  }, [selectedRepo]);

  const loadPulls = useCallback(async (owner: string, repo: string, filter: PrFilter) => {
    const list = await fetchGithubPulls(owner, repo, filter);
    setPulls(list);
    return list;
  }, []);

  const loadIssues = useCallback(async (owner: string, repo: string) => {
    const list = await fetchGithubIssues(owner, repo);
    setIssues(list);
    return list;
  }, []);

  const clearPullDetail = useCallback(() => {
    setPullFiles([]);
    setPullCommits([]);
    setPullComments([]);
    setPullReviews([]);
    setPullChecks(null);
  }, []);

  const loadPullDetail = useCallback(
    async (owner: string, repo: string, number: number) => {
      const requestId = ++detailRequestRef.current;
      setDetailLoading(true);
      clearPullDetail();
      try {
        const [detail, files, commits, convo, labels] = await Promise.all([
          fetchPullDetail(owner, repo, number),
          fetchPullFiles(owner, repo, number),
          fetchPullCommits(owner, repo, number),
          fetchPullComments(owner, repo, number),
          fetchRepoLabels(owner, repo).catch(() => []),
        ]);

        if (detailRequestRef.current !== requestId) return;

        setSelectedPull(detail);
        setPullFiles(files);
        setPullCommits(
          commits as {
            sha: string;
            commit: { message: string; author: { name: string; date: string } };
          }[],
        );
        setPullComments(convo.comments);
        setPullReviews(convo.reviews);
        setRepoLabels(labels);

        if (detail.head.sha) {
          const checks = await fetchPullChecks(owner, repo, detail.head.sha).catch(() => null);
          if (detailRequestRef.current === requestId) setPullChecks(checks);
        }
      } catch (err) {
        if (detailRequestRef.current === requestId) {
          setError(extractApiError(err, "Failed to load pull request"));
        }
      } finally {
        if (detailRequestRef.current === requestId) setDetailLoading(false);
      }
    },
    [clearPullDetail],
  );

  const loadIssueDetail = useCallback(async (owner: string, repo: string, number: number) => {
    const requestId = ++detailRequestRef.current;
    setDetailLoading(true);
    setIssueComments([]);
    try {
      const [detail, comments, labels] = await Promise.all([
        fetchIssueDetail(owner, repo, number),
        fetchIssueComments(owner, repo, number),
        fetchRepoLabels(owner, repo).catch(() => []),
      ]);
      if (detailRequestRef.current !== requestId) return;
      setSelectedIssue(detail);
      setIssueComments(comments);
      setRepoLabels(labels);
    } catch (err) {
      if (detailRequestRef.current === requestId) {
        setError(extractApiError(err, "Failed to load issue"));
      }
    } finally {
      if (detailRequestRef.current === requestId) setDetailLoading(false);
    }
  }, []);

  const loadRepoData = useCallback(
    async (fullName: string, defaultBranch: string, filter: PrFilter) => {
      const parts = fullName.split("/");
      if (parts.length !== 2) return;
      const [owner, repo] = parts;

      const branchList = await fetchGithubBranches(owner, repo);
      setBranches(branchList);
      setBaseBranch(defaultBranch);
      setHeadBranch(branchList.find((b) => b !== defaultBranch) ?? branchList[0] ?? "");

      await Promise.all([loadPulls(owner, repo, filter), loadIssues(owner, repo)]);
    },
    [loadPulls, loadIssues],
  );

  useEffect(() => {
    if (!isLoaded) return;

    setGithubUserId(userId);
    let cancelled = false;

    const oauthError = new URLSearchParams(window.location.search).get("error");
    if (oauthError) setError(oauthError);

    async function init() {
      setLoading(true);
      setSelectedPull(null);
      setSelectedIssue(null);
      setViewMode("create");
      setPrFilter("open");
      try {
        const status = await fetchGithubStatus();
        if (cancelled) return;

        setConnected(status.connected);
        setAuthMode(status.mode);
        setGithubLogin(status.githubLogin);

        if (!status.connected) return;

        const repoList = await fetchGithubRepos();
        if (cancelled) return;
        setRepos(repoList);

        const envRepo = getGithubRepo();
        const savedRepo =
          status.repoOwner && status.repoName
            ? `${status.repoOwner}/${status.repoName}`
            : null;
        const initial =
          savedRepo ??
          (envRepo ? `${envRepo.owner}/${envRepo.repo}` : null) ??
          repoList[0]?.fullName ??
          "";

        if (initial) {
          setSelectedRepo(initial);
          const match = repoList.find((r) => r.fullName === initial);
          await loadRepoData(initial, match?.defaultBranch ?? "main", "open");
        }
      } catch (err) {
        if (!cancelled) setError(extractApiError(err, "Failed to load GitHub data"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, userId, loadRepoData]);

  useEffect(() => {
    if (!repoParts || !selectedPull) return;
    void loadPullDetail(repoParts.owner, repoParts.repo, selectedPull.number);
  }, [selectedPull?.number, repoParts, loadPullDetail]);

  useEffect(() => {
    if (!repoParts || !selectedIssue) return;
    void loadIssueDetail(repoParts.owner, repoParts.repo, selectedIssue.number);
  }, [selectedIssue?.number, repoParts, loadIssueDetail]);

  async function handleRepoChange(fullName: string) {
    setSelectedRepo(fullName);
    setError(undefined);
    setSelectedPull(null);
    setSelectedIssue(null);
    setViewMode("create");
    const match = repos.find((r) => r.fullName === fullName);
    if (match) await loadRepoData(fullName, match.defaultBranch, prFilter);
  }

  async function handlePrFilterChange(filter: PrFilter) {
    setPrFilter(filter);
    if (!repoParts) return;
    await loadPulls(repoParts.owner, repoParts.repo, filter);
  }

  function selectPull(pull: GithubPullItem) {
    detailRequestRef.current += 1;
    clearPullDetail();
    setSelectedPull(pull);
    setSelectedIssue(null);
    setFeedTab("pulls");
    setViewMode("detail");
    setError(undefined);
  }

  function selectIssue(issue: GithubIssueItem) {
    detailRequestRef.current += 1;
    setIssueComments([]);
    setSelectedIssue(issue);
    setSelectedPull(null);
    setFeedTab("issues");
    setViewMode("detail");
    setError(undefined);
  }

  function resetForm(nextMode: WorkflowMode) {
    setMode(nextMode);
    setTitle("");
    setBody("");
    setDraft(false);
    setError(undefined);
    setViewMode("create");
    setSelectedPull(null);
    setSelectedIssue(null);
  }

  async function refreshAfterAction() {
    if (!repoParts) return;
    const newPulls = await loadPulls(repoParts.owner, repoParts.repo, prFilter);
    await loadIssues(repoParts.owner, repoParts.repo);
    if (selectedPull) {
      const updated = newPulls.find((p) => p.number === selectedPull.number);
      if (updated) await loadPullDetail(repoParts.owner, repoParts.repo, updated.number);
    }
  }

  async function handleMergePull() {
    if (!repoParts || !selectedPull) return;
    setMerging(true);
    setError(undefined);
    try {
      const result = await mergeGithubPull({
        owner: repoParts.owner,
        repo: repoParts.repo,
        number: selectedPull.number,
        mergeMethod,
      });
      if (!result.merged) {
        setError(result.message || "Pull request could not be merged");
        return;
      }
      await refreshAfterAction();
    } catch (err) {
      setError(extractApiError(err, "Merge failed"));
    } finally {
      setMerging(false);
    }
  }

  async function handleClosePull() {
    if (!repoParts || !selectedPull) return;
    setClosing(true);
    try {
      await patchPull({
        owner: repoParts.owner,
        repo: repoParts.repo,
        number: selectedPull.number,
        state: "closed",
      });
      await refreshAfterAction();
    } catch (err) {
      setError(extractApiError(err, "Failed to close pull request"));
    } finally {
      setClosing(false);
    }
  }

  async function handleMarkReady() {
    if (!repoParts || !selectedPull) return;
    setClosing(true);
    try {
      await patchPull({
        owner: repoParts.owner,
        repo: repoParts.repo,
        number: selectedPull.number,
        draft: false,
      });
      await refreshAfterAction();
    } catch (err) {
      setError(extractApiError(err, "Failed to mark ready"));
    } finally {
      setClosing(false);
    }
  }

  async function handleSubmit() {
    if (!repoParts || !title.trim()) return;
    setSubmitting(true);
    setError(undefined);
    try {
      if (mode === "issue") {
        const issue = await createGithubIssue({
          owner: repoParts.owner,
          repo: repoParts.repo,
          title: title.trim(),
          body: body.trim(),
        });
        setApplied((prev) => [
          {
            kind: "issue",
            number: issue.number,
            title: title.trim(),
            repo: selectedRepo,
            url: issue.html_url,
            appliedAt: new Date(),
          },
          ...prev,
        ]);
        await refreshAfterAction();
        resetForm("issue");
      } else {
        const pull = await createGithubPull({
          owner: repoParts.owner,
          repo: repoParts.repo,
          title: title.trim(),
          body: body.trim(),
          head: headBranch,
          base: baseBranch,
          draft,
        });
        setApplied((prev) => [
          {
            kind: "pull",
            number: pull.number,
            title: title.trim(),
            repo: selectedRepo,
            url: pull.html_url,
            appliedAt: new Date(),
          },
          ...prev,
        ]);
        await refreshAfterAction();
        resetForm("pull");
      }
    } catch (err) {
      setError(extractApiError(err, "Request failed"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGenerate() {
    if (!repoParts || !headBranch || !baseBranch) return;
    setGenerating(true);
    setError(undefined);
    try {
      const { generated } = await generatePrMessage({
        owner: repoParts.owner,
        repo: repoParts.repo,
        head: headBranch,
        base: baseBranch,
      });
      setTitle(generated.title);
      setBody(generated.body);
    } catch (err) {
      setError(extractApiError(err, "Failed to generate PR message"));
    } finally {
      setGenerating(false);
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-violet-500/10">
          <GitPullRequest className="size-7 text-violet-500" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Connect GitHub</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {error ??
              "Link your GitHub account to create issues and pull requests directly from this workflow."}
          </p>
        </div>
        <Button
          className="bg-violet-600 hover:bg-violet-700"
          onClick={redirectToGithubConnect}
        >
          Connect GitHub
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="shrink-0 border-b border-border/60 bg-card px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-violet-500" />
              <h1 className="text-xl font-semibold tracking-tight text-foreground">Workflow</h1>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              GitHub pull requests, reviews, and issues
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm",
                "border-emerald-500/30 bg-emerald-500/5",
              )}
            >
              <span className="size-2 rounded-full bg-emerald-500" />
              <span className="font-medium text-emerald-700 dark:text-emerald-400">
                GitHub Connected
              </span>
              {authMode === "test-token" ? (
                <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                  Test token
                </span>
              ) : null}
              {githubLogin ? (
                <span className="text-muted-foreground">@{githubLogin}</span>
              ) : null}
            </div>
            <select
              value={selectedRepo}
              onChange={(e) => void handleRepoChange(e.target.value)}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
            >
              {repos.map((r) => (
                <option key={r.fullName} value={r.fullName}>
                  {r.fullName}
                </option>
              ))}
            </select>
            <Button variant="outline" size="sm" onClick={() => resetForm("pull")}>
              New PR
            </Button>
          </div>
        </div>
      </header>

      {error ? (
        <div className="mx-6 mt-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="flex flex-1 flex-col gap-6 p-6 lg:flex-row">
        <PrFeed
          pulls={pulls}
          issues={issues}
          selectedPull={selectedPull}
          selectedIssue={selectedIssue}
          feedTab={feedTab}
          prFilter={prFilter}
          repoName={selectedRepo}
          onFeedTabChange={setFeedTab}
          onPrFilterChange={(f) => void handlePrFilterChange(f)}
          onSelectPull={selectPull}
          onSelectIssue={selectIssue}
        />

        {viewMode === "detail" && selectedPull ? (
          <PrDetail
            pull={selectedPull}
            files={pullFiles}
            commits={pullCommits}
            comments={pullComments}
            reviews={pullReviews}
            checks={pullChecks}
            loading={detailLoading}
            mergeMethod={mergeMethod}
            merging={merging}
            closing={closing}
            onMergeMethodChange={setMergeMethod}
            onMerge={handleMergePull}
            onClose={handleClosePull}
            onMarkReady={handleMarkReady}
            onComment={async (text) => {
              if (!repoParts) return;
              await postPullComment({
                owner: repoParts.owner,
                repo: repoParts.repo,
                number: selectedPull.number,
                body: text,
              });
              await loadPullDetail(repoParts.owner, repoParts.repo, selectedPull.number);
            }}
            onReview={async (text, event) => {
              if (!repoParts) return;
              await postPullReview({
                owner: repoParts.owner,
                repo: repoParts.repo,
                number: selectedPull.number,
                body: text,
                event,
              });
              await loadPullDetail(repoParts.owner, repoParts.repo, selectedPull.number);
            }}
            onUpdate={async (fields) => {
              if (!repoParts) return;
              await patchPull({
                owner: repoParts.owner,
                repo: repoParts.repo,
                number: selectedPull.number,
                ...fields,
              });
              await loadPullDetail(repoParts.owner, repoParts.repo, selectedPull.number);
            }}
          />
        ) : viewMode === "detail" && selectedIssue ? (
          <IssueDetail
            issue={selectedIssue}
            comments={issueComments}
            labels={repoLabels}
            loading={detailLoading}
            saving={issueSaving}
            onComment={async (text) => {
              if (!repoParts) return;
              await postIssueComment({
                owner: repoParts.owner,
                repo: repoParts.repo,
                number: selectedIssue.number,
                body: text,
              });
              await loadIssueDetail(repoParts.owner, repoParts.repo, selectedIssue.number);
            }}
            onUpdate={async (fields) => {
              if (!repoParts) return;
              setIssueSaving(true);
              try {
                const updated = await patchIssue({
                  owner: repoParts.owner,
                  repo: repoParts.repo,
                  number: selectedIssue.number,
                  ...fields,
                });
                setSelectedIssue(updated);
                await loadIssueDetail(repoParts.owner, repoParts.repo, selectedIssue.number);
                await loadIssues(repoParts.owner, repoParts.repo);
              } finally {
                setIssueSaving(false);
              }
            }}
          />
        ) : (
          <CreatePrForm
            mode={mode}
            title={title}
            body={body}
            headBranch={headBranch}
            baseBranch={baseBranch}
            branches={branches}
            draft={draft}
            selectedRepo={selectedRepo}
            submitting={submitting}
            generating={generating}
            error={error}
            onModeChange={resetForm}
            onTitleChange={setTitle}
            onBodyChange={setBody}
            onHeadChange={setHeadBranch}
            onBaseChange={setBaseBranch}
            onDraftChange={setDraft}
            onSubmit={handleSubmit}
            onGenerate={handleGenerate}
            onClear={() => {
              setTitle("");
              setBody("");
              setError(undefined);
            }}
          />
        )}
      </div>

      {applied.length > 0 ? (
        <div className="border-t border-border/60 px-6 py-4">
          <div className="rounded-2xl border border-border/60 bg-card p-5">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Recently Created
            </p>
            <div className="space-y-2">
              {applied.map((item) => (
                <div
                  key={`${item.kind}-${item.number}-${item.appliedAt.getTime()}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/40 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      #{item.number} {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.repo}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs font-medium text-violet-600">
                      <CheckCircle2 className="size-3.5" />
                      Created
                    </span>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      View
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
