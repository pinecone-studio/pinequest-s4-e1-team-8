"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGithubUserId } from "@/hooks/use-github-user-id";
import {
  addGithubProjectItem,
  createGithubIssue,
  createGithubPull,
  extractApiError,
  fetchGithubBranches,
  fetchGithubIssues,
  fetchGithubProjectDetail,
  fetchGithubProjects,
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
  fetchRepoAssignees,
  fetchRepoLabels,
  fetchRepoMilestones,
  createMilestone,
  generatePrMessage,
  getGithubRepo,
  mergeGithubPull,
  patchIssue,
  patchPull,
  postIssueComment,
  postPullComment,
  postPullReview,
  setGithubUserId,
  updateGithubProjectItemField,
  type GithubAssignee,
  type GithubCheckRun,
  type GithubComment,
  type GithubIssueItem,
  type GithubLabel,
  type GithubMilestone,
  type GithubProject,
  type GithubProjectField,
  type GithubProjectItem,
  type GithubPullFile,
  type GithubPullItem,
  type GithubRepoOption,
  type GithubReview,
  type PrFilter,
  connectGithubPAT,
  disconnectGithub,
  GITHUB_TOKEN_URL,
} from "@/lib/integrations/github";
import { cn } from "@/lib/utils";
import {
  Briefcase,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  FolderCode,
  GitPullRequest,
  Loader2,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CreatePrForm } from "./create-pr-form";
import { IssueDetail } from "./issue-detail";
import { PrDetail } from "./pr-detail";
import { PrFeed } from "./pr-feed";
import { ProjectBoard } from "./project-board";
import { findStatusField } from "./workflow-utils";

type WorkflowMode = "issue" | "pull";
type FeedTab = "pulls" | "issues";
type ViewMode = "detail" | "create";
type ActiveView = "work" | "board";

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
  const [githubLogin, setGithubLogin] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [patValue, setPatValue] = useState("");
  const [patLoading, setPatLoading] = useState(false);
  const [patError, setPatError] = useState<string>();
  const [disconnecting, setDisconnecting] = useState(false);
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
  const [repoMilestones, setRepoMilestones] = useState<GithubMilestone[]>([]);
  const [repoAssignees, setRepoAssignees] = useState<GithubAssignee[]>([]);
  const [issueSaving, setIssueSaving] = useState(false);

  // Planning Hub (Projects v2 board)
  const [activeView, setActiveView] = useState<ActiveView>("work");
  const [projects, setProjects] = useState<GithubProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projectFields, setProjectFields] = useState<GithubProjectField[]>([]);
  const [projectItems, setProjectItems] = useState<GithubProjectItem[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [boardLoading, setBoardLoading] = useState(false);
  const [boardError, setBoardError] = useState<string>();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const boardRequestRef = useRef(0);

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
      const [detail, comments, labels, milestones, assignees] = await Promise.all([
        fetchIssueDetail(owner, repo, number),
        fetchIssueComments(owner, repo, number),
        fetchRepoLabels(owner, repo).catch(() => []),
        fetchRepoMilestones(owner, repo).catch(() => []),
        fetchRepoAssignees(owner, repo).catch(() => []),
      ]);
      if (detailRequestRef.current !== requestId) return;
      setSelectedIssue(detail);
      setIssueComments(comments);
      setRepoLabels(labels);
      setRepoMilestones(milestones);
      setRepoAssignees(assignees);
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

      setBaseBranch(defaultBranch);

      // Branches are only needed for the New PR form, so don't let them gate the
      // PR/issue feed — fetch all three in parallel instead of in a waterfall.
      const [branchList] = await Promise.all([
        fetchGithubBranches(owner, repo),
        loadPulls(owner, repo, filter),
        loadIssues(owner, repo),
      ]);
      setBranches(branchList);
      setHeadBranch(branchList.find((b) => b !== defaultBranch) ?? branchList[0] ?? "");
    },
    [loadPulls, loadIssues],
  );

  // Fetch repos + pick an initial one + load its data. Shared by the initial
  // status effect and the in-page PAT connect (which has no page reload to
  // re-run the effect).
  const loadConnectedData = useCallback(
    async (
      saved?: { repoOwner?: string | null; repoName?: string | null },
      prefetchedRepos?: GithubRepoOption[],
    ) => {
      const repoList =
        prefetchedRepos && prefetchedRepos.length > 0
          ? prefetchedRepos
          : await fetchGithubRepos();
      setRepos(repoList);

      const envRepo = getGithubRepo();
      const savedRepo =
        saved?.repoOwner && saved.repoName
          ? `${saved.repoOwner}/${saved.repoName}`
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
    },
    [loadRepoData],
  );

  const loadProjects = useCallback(async () => {
    setProjectsLoading(true);
    setBoardError(undefined);
    try {
      const list = await fetchGithubProjects();
      setProjects(list);
      setSelectedProjectId(
        (prev) => prev || list.find((p) => !p.closed)?.id || list[0]?.id || "",
      );
    } catch (err) {
      setBoardError(extractApiError(err, "Failed to load projects"));
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  const loadProjectDetail = useCallback(async (projectId: string) => {
    if (!projectId) return;
    const requestId = ++boardRequestRef.current;
    setBoardLoading(true);
    try {
      const { fields, items } = await fetchGithubProjectDetail(projectId);
      if (boardRequestRef.current !== requestId) return;
      setProjectFields(fields);
      setProjectItems(items);
    } catch (err) {
      if (boardRequestRef.current === requestId) {
        setProjectFields([]);
        setProjectItems([]);
        setBoardError(extractApiError(err, "Failed to load project"));
      }
    } finally {
      if (boardRequestRef.current === requestId) setBoardLoading(false);
    }
  }, []);

  // Lazy-load projects the first time the selector opens, so users whose PAT
  // lacks the `project` scope aren't charged a failing request up front.
  function handleSelectorOpenChange(open: boolean) {
    if (open && projects.length === 0 && !projectsLoading) {
      void loadProjects();
    }
  }

  function handlePickProject(projectId: string) {
    setActiveView("board");
    setSelectedProjectId(projectId);
  }

  async function handlePickRepo(fullName: string) {
    setActiveView("work");
    await handleRepoChange(fullName);
  }

  const handleMoveItem = useCallback(
    async (itemId: string, newOptionId: string) => {
      const statusField = findStatusField(projectFields);
      if (!statusField) return;
      const statusFieldId = statusField.id;
      const item = projectItems.find((it) => it.id === itemId);
      if (!item) return;
      const currentOptionId =
        item.fieldValues.find((v) => v.fieldId === statusFieldId)?.optionId ?? null;
      if (currentOptionId === newOptionId) return;
      const newOptionName =
        statusField.options?.find((o) => o.id === newOptionId)?.name ?? "";

      const snapshot = projectItems;
      setProjectItems((prev) =>
        prev.map((it) =>
          it.id === itemId
            ? {
                ...it,
                fieldValues: [
                  ...it.fieldValues.filter((v) => v.fieldId !== statusFieldId),
                  {
                    fieldId: statusFieldId,
                    fieldName: statusField.name,
                    value: newOptionName,
                    optionId: newOptionId,
                  },
                ],
              }
            : it,
        ),
      );

      try {
        await updateGithubProjectItemField({
          projectId: selectedProjectId,
          itemId,
          fieldId: statusFieldId,
          value: { singleSelectOptionId: newOptionId },
        });
      } catch (err) {
        setProjectItems(snapshot);
        setBoardError(extractApiError(err, "Failed to move card"));
      }
    },
    [projectFields, projectItems, selectedProjectId],
  );

  const handleAddCard = useCallback(
    async (optionId: string, cardTitle: string) => {
      if (!selectedProjectId || !cardTitle.trim()) return;
      setBoardError(undefined);
      try {
        const itemId = await addGithubProjectItem({
          projectId: selectedProjectId,
          title: cardTitle.trim(),
        });
        const statusField = findStatusField(projectFields);
        if (statusField && optionId) {
          await updateGithubProjectItemField({
            projectId: selectedProjectId,
            itemId,
            fieldId: statusField.id,
            value: { singleSelectOptionId: optionId },
          });
        }
        await loadProjectDetail(selectedProjectId);
      } catch (err) {
        setBoardError(extractApiError(err, "Failed to add card"));
      }
    },
    [selectedProjectId, projectFields, loadProjectDetail],
  );

  async function handlePATConnect() {
    if (!patValue.trim()) return;
    setPatLoading(true);
    setPatError(undefined);
    try {
      const { githubLogin: login } = await connectGithubPAT(patValue.trim());
      setConnected(true);
      setGithubLogin(login);
    } catch {
      setPatError("Invalid token — make sure it's a classic PAT with the full repo scope.");
      setPatLoading(false);
      return;
    }
    // Connected in-page (no reload), so load repos/branches/pulls/issues now.
    setPatLoading(false);
    setLoading(true);
    try {
      await loadConnectedData();
    } catch (err) {
      setError(extractApiError(err, "Connected, but failed to load repositories"));
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await disconnectGithub();
    } catch (err) {
      setError(extractApiError(err, "Failed to disconnect"));
    } finally {
      setDisconnecting(false);
    }
    // Reset back to the connect screen regardless of network outcome.
    setConnected(false);
    setGithubLogin(undefined);
    setPatValue("");
    setRepos([]);
    setSelectedRepo("");
    setPulls([]);
    setIssues([]);
    setSelectedPull(null);
    setSelectedIssue(null);
    setProjects([]);
    setSelectedProjectId("");
    setProjectItems([]);
    setProjectFields([]);
    setActiveView("work");
  }

  useEffect(() => {
    if (!isLoaded) return;

    setGithubUserId(userId);
    let cancelled = false;

    async function init() {
      setLoading(true);
      setSelectedPull(null);
      setSelectedIssue(null);
      setViewMode("create");
      setPrFilter("open");
      try {
        // Status and the repo list are independent — start both up front so the
        // repos request overlaps the status request instead of waterfalling.
        const reposPromise = fetchGithubRepos().catch(
          () => [] as GithubRepoOption[],
        );
        const status = await fetchGithubStatus();
        if (cancelled) return;

        setConnected(status.connected);
        setGithubLogin(status.githubLogin);

        if (!status.connected) return;

        await loadConnectedData(status, await reposPromise);
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
  }, [isLoaded, userId, loadConnectedData]);

  // Key these effects on the issue/PR *number*, not the object reference.
  // loadPullDetail/loadIssueDetail overwrite selectedPull/selectedIssue with a
  // fresh detail object (same number); depending on the object would re-fire the
  // effect on every load and refetch in a loop.
  const selectedPullNumber = selectedPull?.number;
  const selectedIssueNumber = selectedIssue?.number;

  useEffect(() => {
    if (!repoParts || !selectedPullNumber) return;
    void loadPullDetail(repoParts.owner, repoParts.repo, selectedPullNumber);
  }, [selectedPullNumber, repoParts, loadPullDetail]);

  useEffect(() => {
    if (!repoParts || !selectedIssueNumber) return;
    void loadIssueDetail(repoParts.owner, repoParts.repo, selectedIssueNumber);
  }, [selectedIssueNumber, repoParts, loadIssueDetail]);

  useEffect(() => {
    if (activeView !== "board" || !selectedProjectId) return;
    void loadProjectDetail(selectedProjectId);
  }, [activeView, selectedProjectId, loadProjectDetail]);

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
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-violet-700 dark:text-violet-500" />
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-500/10">
            <GitPullRequest className="size-7 text-violet-700 dark:text-violet-500" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-foreground">Connect GitHub</h2>
            <p className="text-sm text-muted-foreground">
              {error ??
                "Paste a personal access token to create issues and pull requests directly from this workflow."}
            </p>
          </div>
          <div className="flex w-full flex-col gap-2">
            <a
              href={GITHUB_TOKEN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-violet-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-violet-700"
            >
              Connect GitHub
              <ExternalLink className="size-4" />
            </a>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              <span>then paste the generated token</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <input
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={patValue}
              onChange={(e) => setPatValue(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
            />
            {patError ? <p className="text-left text-xs text-destructive">{patError}</p> : null}
            <Button
              className="bg-violet-600 hover:bg-violet-700"
              disabled={!patValue.trim() || patLoading}
              onClick={() => void handlePATConnect()}
            >
              {patLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Connect with token
            </Button>
            <p className="text-left text-xs text-muted-foreground">
              Generate a <strong>classic</strong> token at github.com/settings/tokens with the full{" "}
              <code className="text-xs">repo</code> scope (add <code className="text-xs">project</code>{" "}
              for Projects).
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="shrink-0 border-b border-border/60 bg-card px-5 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
              <Sparkles className="size-3.5 text-violet-600 dark:text-violet-400" />
            </div>
            <h1 className="text-sm font-semibold tracking-tight text-foreground">Workflow</h1>
            <span className="hidden text-xs text-muted-foreground lg:block">· Pull requests &amp; issues</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs sm:flex",
                "border-emerald-500/30 bg-emerald-500/5",
              )}
            >
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span className="font-medium text-emerald-700 dark:text-emerald-400">Connected</span>
              {githubLogin ? (
                <span className="text-muted-foreground">@{githubLogin}</span>
              ) : null}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={disconnecting}
              onClick={() => void handleDisconnect()}
              title="Disconnect GitHub"
            >
              {disconnecting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LogOut className="size-4" />
              )}
              <span className="hidden sm:inline">Disconnect</span>
            </Button>
            <DropdownMenu onOpenChange={handleSelectorOpenChange}>
              <DropdownMenuTrigger
                className="flex h-8 min-w-40 items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40"
              >
                <span className="flex min-w-0 items-center gap-2">
                  {activeView === "board" ? (
                    <Briefcase className="size-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <FolderCode className="size-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className="truncate">
                    {activeView === "board"
                      ? (projects.find((p) => p.id === selectedProjectId)?.title ??
                        "Select project")
                      : (selectedRepo || "Select repository")}
                  </span>
                </span>
                <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="max-h-72 w-(--anchor-width)">
                <DropdownMenuRadioGroup
                  value={
                    activeView === "board"
                      ? `project:${selectedProjectId}`
                      : `repo:${selectedRepo}`
                  }
                  onValueChange={(value) => {
                    if (value.startsWith("project:")) {
                      handlePickProject(value.slice("project:".length));
                    } else {
                      void handlePickRepo(value.slice("repo:".length));
                    }
                  }}
                >
                  {projectsLoading ? (
                    <DropdownMenuLabel className="text-muted-foreground">
                      Loading projects…
                    </DropdownMenuLabel>
                  ) : projects.length > 0 ? (
                    <>
                      <DropdownMenuLabel>Projects</DropdownMenuLabel>
                      {projects.map((p) => (
                        <DropdownMenuRadioItem key={p.id} value={`project:${p.id}`}>
                          <Briefcase className="size-4 shrink-0 text-muted-foreground" />
                          <span className="truncate">{p.title}</span>
                        </DropdownMenuRadioItem>
                      ))}
                      <DropdownMenuSeparator />
                    </>
                  ) : null}
                  <DropdownMenuLabel>Repositories</DropdownMenuLabel>
                  {repos.map((r) => (
                    <DropdownMenuRadioItem key={r.fullName} value={`repo:${r.fullName}`}>
                      <FolderCode className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{r.fullName}</span>
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            {activeView === "work" ? (
              <Button variant="outline" size="sm" onClick={() => resetForm("pull")}>
                New PR
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      {activeView === "board" ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3">
          {boardError ? (
            <div className="mb-2 shrink-0 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {boardError}
            </div>
          ) : null}
          <div className="min-h-0 flex-1 overflow-hidden">
            <ProjectBoard
              projects={projects}
              selectedProjectId={selectedProjectId}
              fields={projectFields}
              items={projectItems}
              projectsLoading={projectsLoading}
              boardLoading={boardLoading}
              draggingId={draggingId}
              onSelectProject={setSelectedProjectId}
              onMoveItem={handleMoveItem}
              onAddCard={handleAddCard}
              onDragStart={setDraggingId}
              onDragEnd={() => setDraggingId(null)}
            />
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {error ? (
        <div className="mx-3 mt-2 shrink-0 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-row gap-3 overflow-hidden p-3">
        <PrFeed
          pulls={pulls}
          issues={issues}
          selectedPull={selectedPull}
          selectedIssue={selectedIssue}
          feedTab={feedTab}
          prFilter={prFilter}
          onFeedTabChange={setFeedTab}
          onPrFilterChange={(f) => void handlePrFilterChange(f)}
          onSelectPull={selectPull}
          onSelectIssue={selectIssue}
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
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
            milestones={repoMilestones}
            assignableUsers={repoAssignees}
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
            onCreateMilestone={async (milestoneTitle) => {
              if (!repoParts) return;
              const created = await createMilestone({
                owner: repoParts.owner,
                repo: repoParts.repo,
                title: milestoneTitle,
              });
              setRepoMilestones((prev) => [created, ...prev]);
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
      </div>

      {applied.length > 0 ? (
        <div className="shrink-0 border-t border-border/60 bg-card/40 px-3 py-2">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Recent
            </span>
            {applied.map((item) => (
              <a
                key={`${item.kind}-${item.number}-${item.appliedAt.getTime()}`}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs transition-colors hover:border-violet-500/40"
              >
                <CheckCircle2 className="size-3 text-violet-600" />
                <span className="font-medium text-foreground">#{item.number}</span>
                <span className="max-w-[12rem] truncate text-muted-foreground">{item.title}</span>
                <ExternalLink className="size-3 text-muted-foreground" />
              </a>
            ))}
          </div>
        </div>
      ) : null}
        </div>
      )}
    </div>
  );
}
